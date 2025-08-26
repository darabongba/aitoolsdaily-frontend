import CryptoJS from 'crypto-js';
import { hash } from '../utils/crypto';
import { AUTH_CONFIG } from '../config/auth.encrypted';

interface AuthResult {
  success: boolean;
  token?: string;
  error?: string;
}

export const authenticate = async (username: string, password: string): Promise<AuthResult> => {
  try {
    // 验证尝试次数
    const attempts = parseInt(localStorage.getItem('login_attempts') || '0');
    const lastAttempt = parseInt(localStorage.getItem('last_attempt') || '0');
    const now = Date.now();

    // 如果尝试次数过多，实施冷却时间
    if (attempts >= 5 && (now - lastAttempt) < 15 * 60 * 1000) {
      return {
        success: false,
        error: `请在 ${Math.ceil((15 * 60 * 1000 - (now - lastAttempt)) / 60000)} 分钟后重试`
      };
    }

    // 重置尝试次数
    if ((now - lastAttempt) > 15 * 60 * 1000) {
      localStorage.setItem('login_attempts', '0');
    }

    // 验证用户名和密码的哈希值
    const usernameHash = hash(username);
    const passwordHash = hash(password);

    if (usernameHash !== AUTH_CONFIG.USERNAME_HASH || 
        passwordHash !== AUTH_CONFIG.PASSWORD_HASH) {
      // 更新尝试次数
      localStorage.setItem('login_attempts', (attempts + 1).toString());
      localStorage.setItem('last_attempt', now.toString());
      
      return {
        success: false,
        error: '用户名或密码错误'
      };
    }

    // 验证成功，生成token
    const token = generateToken();
    const expireTime = new Date();
    expireTime.setMonth(expireTime.getMonth() + 1);

    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_expire', expireTime.getTime().toString());
    localStorage.removeItem('login_attempts');
    localStorage.removeItem('last_attempt');

    return {
      success: true,
      token
    };
  } catch (error) {
    return {
      success: false,
      error: '认证过程出错'
    };
  }
};

const generateToken = (): string => {
  return CryptoJS.lib.WordArray.random(32).toString();
};
