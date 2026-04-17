/**
 * Cloudflare Pages - 全局身份验证中间件
 * 
 * 工作机制:
 * - 读取环境变量 PASSWORD
 * - 若 PASSWORD 未设置，所有请求均返回 403 禁止访问
 * - 对 /login 页面、/auth API 本身放行，其余路径需校验 cookie
 * - Cookie: auth_token = HMAC-SHA256(PASSWORD, salt)
 */

const AUTH_COOKIE = 'auth_token';
const SALT = 'cf-dashboard-auth-v1';

async function computeToken(password) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(SALT),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(password)
    );
    return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

function getAuthToken(request) {
    const cookieHeader = request.headers.get('Cookie') || '';
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${AUTH_COOKIE}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : null;
}

export async function onRequest(context) {
    const { request, env, next } = context;
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. 必须设置 PASSWORD 环境变量，否则完全拒绝访问
    if (!env.PASSWORD) {
        return new Response(
            `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>配置错误</title>
<style>
  body { background: #13131f; color: #ff007a; font-family: 'Inter', sans-serif; 
         display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; flex-direction: column; gap: 1rem; }
  h1 { font-size: 2rem; } p { color: #8c8cab; }
  code { background: rgba(255,0,122,0.1); padding: 2px 8px; border-radius: 4px; color: #ff007a; }
</style>
</head>
<body>
  <h1>🔐 访问被禁止</h1>
  <p>环境变量 <code>PASSWORD</code> 未配置，系统拒绝一切访问。</p>
  <p>请在 Cloudflare Pages 控制台的 Settings → Environment Variables 中配置 <code>PASSWORD</code>。</p>
</body>
</html>`,
            { status: 403, headers: { 'Content-Type': 'text/html;charset=UTF-8' } }
        );
    }

    // 2. 放行登录页面及其静态资源
    if (path === '/login' || path === '/login.html') {
        return next();
    }

    // 3. 放行认证接口（由 functions/auth.js 处理）
    if (path === '/auth') {
        return next();
    }

    // 4. 处理登出逻辑：清除 cookie 并重定向到登录页
    if (path === '/logout') {
        const logoutUrl = new URL('/login', url.origin);
        return new Response(null, {
            status: 302,
            headers: {
                'Location': logoutUrl.toString(),
                'Set-Cookie': 'auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Strict'
            }
        });
    }

    // 5. 放行静态资源（字体、图片等，非 HTML 页面）
    const ext = path.split('.').pop().toLowerCase();
    if (['css', 'js', 'png', 'jpg', 'svg', 'ico', 'woff', 'woff2', 'ttf'].includes(ext)) {
        return next();
    }

    // 5. 验证 Cookie 中的 token
    const tokenInCookie = getAuthToken(request);
    const expectedToken = await computeToken(env.PASSWORD);

    if (tokenInCookie === expectedToken) {
        return next();
    }

    // 6. 未认证：重定向到登录页
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('redirect', path);
    return Response.redirect(loginUrl.toString(), 302);
}
