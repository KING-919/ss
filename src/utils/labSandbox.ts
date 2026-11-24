export const WEAK_JWT_SECRET = 'secret123';

export interface JwtPayload {
  id: number;
  username: string;
  role: string;
  name?: string;
  iat?: number;
}

function utf8ToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function base64UrlEncode(input: string): string {
  return bytesToBase64Url(utf8ToBytes(input));
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + '='.repeat(padLen));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// Pure isomorphic SHA-256 + HMAC-SHA256 (works identically in Node.js and Browsers)
const K256 = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function sha256Bytes(data: Uint8Array): Uint8Array {
  const bitLen = data.length * 8;
  const padLen = ((56 - ((data.length + 1) % 64)) + 64) % 64;
  const padded = new Uint8Array(data.length + 1 + padLen + 8);
  padded.set(data);
  padded[data.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 4, bitLen >>> 0, false);
  view.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000), false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K256[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  [h0, h1, h2, h3, h4, h5, h6, h7].forEach((val, idx) => outView.setUint32(idx * 4, val, false));
  return out;
}

function hmacSha256Base64Url(key: string, message: string): string {
  const blockSize = 64;
  let keyBytes = utf8ToBytes(key);
  if (keyBytes.length > blockSize) {
    keyBytes = sha256Bytes(keyBytes);
  }
  const paddedKey = new Uint8Array(blockSize);
  paddedKey.set(keyBytes);

  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = paddedKey[i] ^ 0x5c;
    iKeyPad[i] = paddedKey[i] ^ 0x36;
  }

  const msgBytes = utf8ToBytes(message);
  const innerInput = new Uint8Array(blockSize + msgBytes.length);
  innerInput.set(iKeyPad);
  innerInput.set(msgBytes, blockSize);
  const innerHash = sha256Bytes(innerInput);

  const outerInput = new Uint8Array(blockSize + innerHash.length);
  outerInput.set(oKeyPad);
  outerInput.set(innerHash, blockSize);
  return bytesToBase64Url(sha256Bytes(outerInput));
}

/**
 * Intentionally vulnerable JWT signer using a trivial weak secret ('secret123').
 */
export function signWeakJwt(payload: JwtPayload): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(
    JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }),
  );
  const sig = hmacSha256Base64Url(WEAK_JWT_SECRET, `${header}.${body}`);
  return `${header}.${body}.${sig}`;
}

/**
 * Intentionally vulnerable JWT verifier:
 * 1) Accepts alg: "none" without verifying any signature!
 * 2) Uses weak secret "secret123" for HS256.
 */
export function verifyWeakJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const header = JSON.parse(base64UrlDecode(parts[0])) as { alg?: string };
    const payload = JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;

    // Vulnerability: alg=none bypass!
    if (!header.alg || header.alg.toLowerCase() === 'none') {
      return payload;
    }

    const expectedSig = hmacSha256Base64Url(WEAK_JWT_SECRET, `${parts[0]}.${parts[1]}`);
    if (parts[2] === expectedSig) {
      return payload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Virtual sandboxed filesystem for Path Traversal lab.
 * Never accesses real OS files outside this virtual map.
 */
const VIRTUAL_FS: Record<string, string> = {
  '/app/public/resources/qudrat_quant_summary.txt':
    'ملخص قوانين القدرات الكمي - منصة ثانوية العارضة\n1. مساحة المثلث = نصف القاعدة × الارتفاع\n2. النسبة المئوية = (الجزء / الكل) × 100\n3. متوسط السرعة = المسافة الكلية / الزمن الكلي',
  '/app/public/resources/tahsili_physics_notes.txt':
    'مذكرة التحصيلي في الفيزياء\nقانون نيوتن الثاني: F = m * a\nقانون أوم: V = I * R\nطاقة الفوتون: E = h * f',
  '/app/public/resources/verbal_guide.txt':
    'دليل التناظر اللفظي واستيعاب المقروء\n- تحديد العلاقة بين الكلمتين (تضاد، ترادف، جزء من كل، سبب ونتيجة).',
  '/app/config/db-secrets.txt':
    'DB_HOST=127.0.0.1\nDB_USER=alardah_root\nDB_PASS=SuperSecretSchoolDB!2026\nLAB_FLAG=FLAG{PATH_TRAVERSAL_DB_CONFIG_LEAK}',
  '/app/.env.lab':
    'LAB_ENV=production\nJWT_SECRET=secret123\nADMIN_MASTER_KEY=ADM-9981-KEY\nLAB_FLAG=FLAG{DOT_ENV_EXPOSURE_SUCCESS}',
  '/etc/passwd':
    'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nalardah:x:1000:1000:Alardah Platform:/app:/bin/sh\n# FLAG{SANDBOXED_LFI_ETC_PASSWD}',
  '/var/backups/admin_backup.sql':
    '-- Alardah SQL Backup\nINSERT INTO users (username, password, role) VALUES (\'admin\', \'admin123\', \'admin\');\n-- FLAG{SQL_BACKUP_LEAKED}',
};

export function resolveVirtualFile(requestedPath: string): {
  found: boolean;
  resolvedPath: string;
  content?: string;
} {
  const baseDir = '/app/public/resources';
  const normalizedInput = requestedPath.replace(/\\/g, '/').trim();

  // Naive join intentionally vulnerable to ../ traversal inside the virtual FS
  const rawSegments = normalizedInput.startsWith('/')
    ? normalizedInput.split('/')
    : [...baseDir.split('/'), ...normalizedInput.split('/')];

  const stack: string[] = [];
  for (const seg of rawSegments) {
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      stack.pop();
    } else {
      stack.push(seg);
    }
  }
  const resolved = '/' + stack.join('/');
  const content = VIRTUAL_FS[resolved];
  if (content !== undefined) {
    return { found: true, resolvedPath: resolved, content };
  }
  return { found: false, resolvedPath: resolved };
}

/**
 * Sandboxed Command Injection simulator for the Dashboard network diagnostic tool.
 */
export function executeSandboxedPing(hostInput: string): {
  command: string;
  output: string;
  injected: boolean;
} {
  const raw = hostInput.trim();
  const fullCommand = `ping -c 1 ${raw}`;
  const operators = /[;&|`$]/;
  const injected = operators.test(raw);

  const parts = raw.split(/[;&|]+/).map((p) => p.trim()).filter(Boolean);
  const outputs: string[] = [];

  const targetHost = parts[0] || 'localhost';
  if (/^[a-zA-Z0-9.-]+$/.test(targetHost)) {
    outputs.push(
      `PING ${targetHost} (127.0.0.1): 56 data bytes\n64 bytes from 127.0.0.1: icmp_seq=0 ttl=64 time=0.42 ms\n--- ${targetHost} ping statistics ---\n1 packets transmitted, 1 received, 0% packet loss`,
    );
  } else {
    outputs.push(`ping: ${targetHost}: Name or service not known`);
  }

  for (let i = 1; i < parts.length; i++) {
    const cmd = parts[i].replace(/^\$\((.*)\)$/, '$1').replace(/`/g, '').trim();
    if (cmd === 'whoami') {
      outputs.push('alardah-app-service');
    } else if (cmd === 'id') {
      outputs.push('uid=1000(alardah) gid=1000(alardah) groups=1000(alardah),27(sudo)');
    } else if (cmd === 'pwd') {
      outputs.push('/app/public/resources');
    } else if (cmd === 'uname -a' || cmd === 'uname') {
      outputs.push('Linux alardah-lab-node 6.1.0-sandbox #1 SMP x86_64 GNU/Linux');
    } else if (cmd.startsWith('ls')) {
      outputs.push(
        'qudrat_quant_summary.txt\ntahsili_physics_notes.txt\nverbal_guide.txt\n../config/db-secrets.txt\n../../.env.lab',
      );
    } else if (cmd === 'env' || cmd === 'printenv') {
      outputs.push(
        'APP_NAME=AlardahPlatform\nJWT_SECRET=secret123\nDB_PATH=/app/data/school.sqlite\nLAB_FLAG=FLAG{CMD_INJECTION_ENV_DUMP}',
      );
    } else if (cmd.startsWith('cat ')) {
      const target = cmd.slice(4).trim();
      const fileRes = resolveVirtualFile(target);
      if (fileRes.found && fileRes.content) {
        outputs.push(fileRes.content);
      } else {
        outputs.push(`cat: ${target}: No such file or directory`);
      }
    } else {
      outputs.push(`[sandbox-sh]: executed '${cmd}' -> FLAG{COMMAND_INJECTION_RCE_SIM}`);
    }
  }

  return {
    command: fullCommand,
    output: outputs.join('\n\n'),
    injected,
  };
}

/**
 * Sandboxed SSRF resolver for "Import Resource from URL".
 */
export function resolveSandboxedSsrf(targetUrl: string): {
  internal: boolean;
  status: number;
  title: string;
  body: string;
} {
  try {
    const parsed = new URL(targetUrl);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname;

    if (host === '169.254.169.254') {
      return {
        internal: true,
        status: 200,
        title: 'Cloud Instance Metadata (SSRF)',
        body: JSON.stringify(
          {
            instanceId: 'i-0alardah99182lab',
            iamRole: 'AlardahAdminRole',
            accessKeyId: 'AKIA_LAB_FAKE_KEY_9912',
            secretAccessKey: 'SECRET_LAB_FLAG{SSRF_CLOUD_METADATA_LEAK}',
          },
          null,
          2,
        ),
      };
    }

    if (
      host === '127.0.0.1' ||
      host === 'localhost' ||
      host === '0.0.0.0' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.endsWith('.local')
    ) {
      return {
        internal: true,
        status: 200,
        title: `Internal Service Response (${host}${pathname})`,
        body: JSON.stringify(
          {
            service: 'alardah-internal-admin-rpc',
            endpoint: pathname,
            internalApiToken: 'INT-TOKEN-88412-ADMIN',
            flag: 'FLAG{SSRF_INTERNAL_NETWORK_ACCESS}',
            dbConnection: 'sqlite:///app/data/school.sqlite',
          },
          null,
          2,
        ),
      };
    }

    return {
      internal: false,
      status: 200,
      title: `محتوى مستورد من ${parsed.hostname}`,
      body: `تم جلب ملخص تعليمي تجريبي من الرابط الخارجي: ${targetUrl}\nالمحتوى: مراجعة شاملة لمهارات القدرات والتحصيلي.`,
    };
  } catch {
    return {
      internal: false,
      status: 400,
      title: 'رابط غير صالح',
      body: 'تعذر تحليل عنوان URL المدخل.',
    };
  }
}

/**
 * Intentionally vulnerable recursive merge (Prototype Pollution).
 */
export function unsafeMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  for (const key of Object.keys(source)) {
    const val = source[key];
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (!target[key] || typeof target[key] !== 'object') {
        target[key] = {};
      }
      unsafeMerge(
        target[key] as Record<string, unknown>,
        val as Record<string, unknown>,
      );
    } else {
      target[key] = val;
    }
  }
  return target;
}

/**
 * Intentionally vulnerable SSTI-like certificate renderer.
 * Evaluates expressions inside {{ ... }} in a sandboxed Function scope.
 */
export function renderVulnerableTemplate(
  template: string,
  context: Record<string, unknown>,
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_match, expr: string) => {
    try {
      const safeContext = {
        ...context,
        labFlag: 'FLAG{SSTI_TEMPLATE_INJECTION_49}',
      };
      const keys = Object.keys(safeContext);
      const values = Object.values(safeContext);
      const fn = new Function(...keys, `return (${expr.trim()});`);
      const result = fn(...values);
      return String(result);
    } catch (err) {
      return `[Template Error: ${(err as Error).message}]`;
    }
  });
}
