/**
 * 本物の mysql2 ドライバを使うが、トランスポートだけを WebSocket にすげ替える。
 *
 * ポイント：mysql2 は無改造。`stream` オプションに WebSocketStream を渡すだけ。
 * mysql2 は MySQL プロトコルを喋り、そのバイトは WebSocket → プロキシ → 本物のTCP
 * 経由で MySQL に届く。これが「ソケット層の橋渡し」の検証。
 */
import mysql from 'mysql2/promise';
import { WebSocketStream } from './ws-stream.mjs';

const WS_URL = 'ws://127.0.0.1:8090';

console.log('--- 本物の mysql2 ドライバ + WebSocket トランスポート ---');
console.log('mysql2 は net.Socket を使っているつもり。実体は WebSocket。\n');

const conn = await mysql.createConnection({
  user: 'demo',
  password: 'demopass',
  database: 'demodb',
  charset: 'utf8mb4', // 日本語(マルチバイト)が mojibake にならないよう明示

  // ★ ここが肝：TCP ソケットの代わりに WebSocket 製の Duplex を渡す
  stream: () => new WebSocketStream(WS_URL),
});

console.log('✅ 接続成功（この接続はTCP直結ではなくWebSocket経由）\n');

const [meta] = await conn.query('SELECT NOW() AS now, VERSION() AS version, CONNECTION_ID() AS conn_id');
console.log('SELECT NOW(), VERSION():');
console.log(meta[0], '\n');

const [todos] = await conn.query('SELECT id, task, done FROM todos ORDER BY id');
console.log('SELECT * FROM todos:');
console.table(todos);

// 書き込みも通ることを確認
await conn.query("INSERT INTO todos (task, done) VALUES ('WebSocket経由でINSERTする', 1)");
const [after] = await conn.query('SELECT COUNT(*) AS count FROM todos');
console.log(`\nINSERT 後の件数: ${after[0].count}`);

await conn.end();
console.log('\n✅ すべて WebSocket トンネル経由で実行完了。mysql2 は無改造のまま動いた。');
