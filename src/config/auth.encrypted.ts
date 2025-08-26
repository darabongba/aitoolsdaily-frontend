import { encrypt, hash } from '../utils/crypto';

// 预先计算的哈希值和加密值
export const AUTH_CONFIG = {
  USERNAME_HASH: hash('zhangyunpeng'),
  PASSWORD_HASH: hash('507933'),
  ENCRYPTED_USERNAME: encrypt('zhangyunpeng'),
  ENCRYPTED_PASSWORD: encrypt('507933')
};
