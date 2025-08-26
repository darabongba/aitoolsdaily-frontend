import { encrypt, hash } from '../src/utils/crypto';

const username = 'zhangyunpeng';
const password = '507933';

const config = {
  USERNAME_HASH: hash(username),
  PASSWORD_HASH: hash(password),
  ENCRYPTED_USERNAME: encrypt(username),
  ENCRYPTED_PASSWORD: encrypt(password)
};

console.log('Export this to src/config/auth.encrypted.ts:');
console.log('export const AUTH_CONFIG = ' + JSON.stringify(config, null, 2) + ';');
