import crypto from 'node:crypto';

export const WEAK_JWT_SECRET = 'secret123';

export interface JwtPayload {
  id: number;
  username: string;
  role: string;
  name?: string;
  iat?: number;
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const padLen = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padLen), 'base64').toString('utf-8');
}

/**
 * Intentionally vulnerable JWT signer using a trivial weak secret ('secret123').
 */
export function signWeakJwt(payload: JwtPayload): string {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(
    JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000) }),
  );
  const sig = crypto
    .createHmac('sha256', WEAK_JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
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

    const expectedSig = crypto
      .createHmac('sha256', WEAK_JWT_SECRET)
      .update(`${parts[0]}.${parts[1]}`)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

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
