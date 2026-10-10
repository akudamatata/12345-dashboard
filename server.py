import os
import sys
import glob
import json
import io
import time
import threading
import webbrowser
import urllib.parse
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import pandas as pd
from analyzer import analyze_excel, load_config, save_config

PORT = 8088
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 内存中保存当前激活的分析数据
CURRENT_CACHE = {
    'filename': '',
    'bytes': None,
    'result': None
}

class CaseHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        try:
            url_parsed = urllib.parse.urlparse(self.path)
            path = url_parsed.path
            
            if path == '/' or path == '/index.html':
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.end_headers()
                html_path = os.path.join(BASE_DIR, 'web', 'index.html')
                if os.path.exists(html_path):
                    with open(html_path, 'rb') as f:
                        self.wfile.write(f.read())
                else:
                    self.wfile.write(b'<h1>Index.html not found</h1>')
                return
                
            elif path == '/api/config':
                self.send_json(load_config())
                return
                
            elif path == '/api/analyze':
                if CURRENT_CACHE['bytes'] is not None:
                    try:
                        res = analyze_excel(io.BytesIO(CURRENT_CACHE['bytes']))
                        res['filename'] = CURRENT_CACHE['filename']
                        CURRENT_CACHE['result'] = res
                        self.send_json(res)
                        return
                    except Exception as e:
                        self.send_json({'error': f'分析缓存文件失败: {str(e)}'})
                        return
                        
                files = glob.glob(os.path.join(BASE_DIR, '*.xlsx'))
                files = [f for f in files if not os.path.basename(f).startswith('~$') and '统计' not in f]
                if not files:
                    self.send_json({'error': '未在根目录找到工单表格，请点击上方“导入表格”上传'})
                    return
                latest_file = max(files, key=os.path.getmtime)
                try:
                    with open(latest_file, 'rb') as f:
                        file_bytes = f.read()
                    CURRENT_CACHE['filename'] = os.path.basename(latest_file)
                    CURRENT_CACHE['bytes'] = file_bytes
                    res = analyze_excel(io.BytesIO(file_bytes))
                    res['filename'] = CURRENT_CACHE['filename']
                    CURRENT_CACHE['result'] = res
                    self.send_json(res)
                except Exception as e:
                    self.send_json({'error': f'解析失败: {str(e)}'})
                return
                
            elif path == '/api/export':
                res = CURRENT_CACHE.get('result')
                if not res:
                    self.send_error(400, 'No data to export')
                    return
                
                output = io.BytesIO()
                with pd.ExcelWriter(output, engine='openpyxl') as writer:
                    df1 = pd.DataFrame(res['table1'])
                    df2 = pd.DataFrame(res['table2'])
                    df1.to_excel(writer, sheet_name='各部门办结情况统计', index=False)
                    df2.to_excel(writer, sheet_name='各部门业务分类统计', index=False)
                
                output.seek(0)
                self.send_response(200)
                self.send_header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                filename = urllib.parse.quote("12345工单统计报表.xlsx")
                self.send_header('Content-Disposition', f"attachment; filename*=UTF-8''{filename}")
                self.end_headers()
                self.wfile.write(output.getvalue())
                return
                
            super().do_GET()
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass

    def do_POST(self):
        try:
            url_parsed = urllib.parse.urlparse(self.path)
            path = url_parsed.path
            content_len = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_len)

            if path == '/api/config':
                try:
                    new_cfg = json.loads(post_body.decode('utf-8'))
                    save_config(new_cfg)
                    if CURRENT_CACHE['bytes'] is not None:
                        CURRENT_CACHE['result'] = analyze_excel(io.BytesIO(CURRENT_CACHE['bytes']), new_cfg)
                        CURRENT_CACHE['result']['filename'] = CURRENT_CACHE['filename']
                    self.send_json({'success': True, 'config': new_cfg, 'result': CURRENT_CACHE.get('result')})
                except Exception as e:
                    self.send_json({'error': str(e)})
                return
                
            elif path == '/api/upload':
                try:
                    filename = urllib.parse.unquote(self.headers.get('X-Filename', 'uploaded.xlsx'))
                    CURRENT_CACHE['filename'] = filename
                    CURRENT_CACHE['bytes'] = post_body
                    res = analyze_excel(io.BytesIO(post_body))
                    res['filename'] = filename
                    CURRENT_CACHE['result'] = res
                    self.send_json(res)
                except Exception as e:
                    self.send_json({'error': f'解析上传表格失败: {str(e)}'})
                return

            self.send_error(404, 'Not Found')
        except (ConnectionAbortedError, ConnectionResetError, BrokenPipeError):
            pass

    def send_json(self, data):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def log_message(self, format, *args):
        # 简化日志，避免控制台报错刷屏
        sys.stderr.write("%s - - [%s] %s\n" % (self.client_address[0], self.log_date_time_string(), format%args))

def open_browser():
    time.sleep(1.2)
    url = f"http://127.0.0.1:{PORT}"
    try:
        webbrowser.open(url)
    except Exception:
        pass

def run():
    os.chdir(BASE_DIR)
    threading.Thread(target=open_browser, daemon=True).start()
    server = ThreadingHTTPServer(('127.0.0.1', PORT), CaseHandler)
    print("=" * 55)
    print("  12345 工单数据统计服务已成功启动！")
    print(f"  本地访问地址: http://127.0.0.1:{PORT}")
    print("  系统正在为您自动打开默认浏览器...")
    print("  (如需关闭本服务，直接关闭此黑窗口即可)")
    print("=" * 55)
    server.serve_forever()

if __name__ == '__main__':
    run()
