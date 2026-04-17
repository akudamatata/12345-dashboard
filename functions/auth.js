/**
 * Cloudflare Pages Function - POST /auth
 * 处理登录表单提交，验证密码并颁发认证 Cookie
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

export async function onRequestPost(context) {
    const { request, env } = context;

    // PASSWORD 未配置时直接拒绝
    if (!env.PASSWORD) {
        return Response.json({ success: false, message: '系统未配置访问密码，禁止登录。' }, { status: 403 });
    }

    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ success: false, message: '请求格式错误。' }, { status: 400 });
    }

    const { password } = body;

    if (!password || password !== env.PASSWORD) {
        // 故意延迟 500ms 防止暴力枚举
        await new Promise(r => setTimeout(r, 500));
        return Response.json({ success: false, message: '密码错误，拒绝访问。' }, { status: 401 });
    }

    const token = await computeToken(env.PASSWORD);
    const url = new URL(request.url);

    // Cookie 有效期: 8 小时（一个工作日）
    const maxAge = 60 * 60 * 8;

    return Response.json(
        { success: true },
        {
            status: 200,
            headers: {
                'Set-Cookie': `${AUTH_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Strict`,
            },
        }
    );
}

// GET 请求不支持
export async function onRequestGet() {
    return new Response('Method Not Allowed', { status: 405 });
}
