import os
import json
import glob
import pandas as pd

CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.json')

DEFAULT_CONFIG = {
    "keyword": "违建",
    "mappings": [
        { "dept": "向阳大队", "person": "孟晶琦" },
        { "dept": "振兴大队", "person": "许艺凡" },
        { "dept": "松州大队", "person": "张振泽" },
        { "dept": "铁东大队", "person": "杨书欣" },
        { "dept": "兴安大队", "person": "王振威" },
        { "dept": "玉龙大队", "person": "王端阳" },
        { "dept": "全宁大队", "person": "王杰文" },
        { "dept": "松城大队", "person": "李颖" },
        { "dept": "二大队", "person": "梁宏达" },
        { "dept": "三大队", "person": "贾春生" },
        { "dept": "园林中心", "person": "李立" },
        { "dept": "市政中心", "person": "朱新园" },
        { "dept": "环卫中心", "person": "宗梓祺" },
        { "dept": "人事财务股", "person": "成凤枝" },
        { "dept": "审批中心", "person": "杨欣蕾" }
    ]
}

def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return DEFAULT_CONFIG

def save_config(cfg):
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(cfg, f, ensure_ascii=False, indent=2)

def match_department(person_str, person_dept_pairs):
    """
    严格仅通过当前负责人或历史审批人字符串匹配人名与部门。
    """
    if not person_str:
        return '其他/未匹配'

    for p_name, d_name in person_dept_pairs:
        if p_name in person_str:
            return d_name
            
    return '其他/未匹配'

def analyze_excel(file_source, cfg=None):
    """
    file_source: 文件路径或 BytesIO 对象
    cfg: 可选配置对象，未传入则加载 config.json
    """
    if cfg is None:
        cfg = load_config()
        
    mappings = cfg.get('mappings', [])
    keyword = cfg.get('keyword', '违建').strip()
    if not keyword:
        keyword = '违建'

    dept_order = []
    person_dept_pairs = []
    for m in mappings:
        d = str(m.get('dept', '')).strip()
        p = str(m.get('person', '')).strip()
        if d and d not in dept_order:
            dept_order.append(d)
        if d and p:
            names = [x.strip() for x in p.replace('，', ',').replace('、', ',').split(',') if x.strip()]
            for name in names:
                person_dept_pairs.append((name, d))

    if '其他/未匹配' not in dept_order:
        dept_order.append('其他/未匹配')

    df = pd.read_excel(file_source)
    
    records = []
    for idx, row in df.iterrows():
        sp_status = str(row.get('审批状态', '')).strip()
        sp_result = str(row.get('审批结果', '')).strip()
        
        status_category = None
        if sp_result == '审批通过':
            status_category = '办结'
        elif sp_status == '审批中':
            status_category = '未办结'
        else:
            continue
            
        cur_person = str(row.get('当前负责人', '')).strip()
        hist_persons = str(row.get('历史审批人', '')).strip()
        details = str(row.get('案件详情', '')).strip()
        
        # 部门判定：优先通过历史审批人识别承办大队责任人，若未匹配再通过当前负责人识别
        matched_dept = match_department(hist_persons, person_dept_pairs)
        if matched_dept == '其他/未匹配':
            matched_dept = match_department(cur_person, person_dept_pairs)
                    
        # 关键字识别
        has_kw = keyword in details
        biz_type = keyword if has_kw else '市容市貌'
        
        records.append({
            '序号': row.get('序号', idx + 1),
            '部门': matched_dept,
            '办结状态': status_category,
            '业务分类': biz_type,
            '当前负责人': cur_person,
            '历史审批人': hist_persons,
            '审批状态': sp_status,
            '审批结果': sp_result,
            '案件详情': details[:150] + ('...' if len(details) > 150 else '')
        })

    # 统计表一: 各部门 办结多少 没办结多少 总数多少
    table1 = []
    # 统计表二: 各部门 市容市貌多少 关键字(违建)多少 总数多少
    table2 = []
    
    for dept in dept_order:
        dept_records = [r for r in records if r['部门'] == dept]
        if not dept_records and dept in ['其他/未匹配', '人事财务股', '审批中心']:
            # 允许展示零数据的部门
            pass
            
        done_cnt = sum(1 for r in dept_records if r['办结状态'] == '办结')
        undone_cnt = sum(1 for r in dept_records if r['办结状态'] == '未办结')
        total_status = done_cnt + undone_cnt
        
        table1.append({
            '部门': dept,
            '已办结': done_cnt,
            '未办结': undone_cnt,
            '总数': total_status
        })
        
        kw_cnt = sum(1 for r in dept_records if r['业务分类'] == keyword)
        other_cnt = sum(1 for r in dept_records if r['业务分类'] != keyword)
        total_biz = kw_cnt + other_cnt
        
        table2.append({
            '部门': dept,
            '市容市貌': other_cnt,
            keyword: kw_cnt,
            '总数': total_biz
        })

    # 合计行
    table1.append({
        '部门': '【合计】',
        '已办结': sum(r['已办结'] for r in table1),
        '未办结': sum(r['未办结'] for r in table1),
        '总数': sum(r['总数'] for r in table1)
    })
    table2.append({
        '部门': '【合计】',
        '市容市貌': sum(r['市容市貌'] for r in table2),
        keyword: sum(r[keyword] for r in table2),
        '总数': sum(r['总数'] for r in table2)
    })

    # 生成专供态势感知【数据录入中心】的直接对接结构
    dept_map_t2 = {r['部门']: r for r in table2}
    
    # 左表：8个直属大队明细
    squad_list = ['向阳大队', '兴安大队', '全宁大队', '振兴大队', '松州大队', '玉龙大队', '铁东大队', '松城大队']
    dashboard_squads = []
    sum_urban = 0
    sum_illegal = 0
    for sq in squad_list:
        row = dept_map_t2.get(sq, {'市容市貌': 0, keyword: 0})
        u = row['市容市貌']
        i = row[keyword]
        sum_urban += u
        sum_illegal += i
        dashboard_squads.append({
            'squad_name': sq,
            'urban': u,
            'illegal': i,
            'total': u + i
        })

    # 右表：9个全局科目汇总
    dashboard_summary = [
        { 'name': '市容市貌', 'workload': sum_urban },
        { 'name': '违法建设', 'workload': sum_illegal },
        { 'name': '市政设施', 'workload': dept_map_t2.get('市政中心', {}).get('总数', 0) },
        { 'name': '环境卫生', 'workload': dept_map_t2.get('环卫中心', {}).get('总数', 0) },
        { 'name': '三大队 (施工噪音扬尘渣土)', 'workload': dept_map_t2.get('三大队', {}).get('总数', 0) },
        { 'name': '二大队', 'workload': dept_map_t2.get('二大队', {}).get('总数', 0) },
        { 'name': '园林绿化', 'workload': dept_map_t2.get('园林中心', {}).get('总数', 0) },
        { 'name': '人事财务股', 'workload': dept_map_t2.get('人事财务股', {}).get('总数', 0) },
        { 'name': '审批中心', 'workload': dept_map_t2.get('审批中心', {}).get('总数', 0) }
    ]
    
    return {
        'keyword': keyword,
        'table1': table1,
        'table2': table2,
        'total_analyzed': len(records),
        'records': records,
        'dashboard_squads': dashboard_squads,
        'dashboard_summary': dashboard_summary
    }

if __name__ == '__main__':
    files = glob.glob('111.xlsx') or glob.glob('*.xlsx')
    if files:
        res = analyze_excel(files[0])
        print("Dashboard Squads Data:")
        print(json.dumps(res['dashboard_squads'], ensure_ascii=False, indent=2))
        print("\nDashboard Summary Data:")
        print(json.dumps(res['dashboard_summary'], ensure_ascii=False, indent=2))
