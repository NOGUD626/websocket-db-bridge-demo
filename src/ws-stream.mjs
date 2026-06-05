/**
 * WebSocket を Node の Duplex ストリームとして見せかけるラッパー。
 *
 * これが「ソケット層の橋渡し」の正体：
 * mysql2 は「普通の socket（net.Socket）」を使っているつもりで読み書きするが、
 * 実体はこの Duplex で、中身は WebSocket に流れている。
 * mysql2 自体は一切改造していない（WebSocket だと気づかない）。
 */
import { Duplex } from 'node:stream';
import WebSocket from 'ws';

export class WebSocketStream extends Duplex {
  constructor(url) {
    super();
    this._open = false;
    this._queue = [];
    this.ws = new WebSocket(url);
    this.ws.binaryType = 'nodebuffer';

    this.ws.on('open', () => {
      this._open = true;
      // 開通前に溜まった書き込みを流す
      for (const { chunk, cb } of this._queue) this.ws.send(chunk, cb);
      this._queue = [];
      // mysql2 が socket 同様 'connect' を待つ場合に備えて発火
      this.emit('connect');
    });

    // MySQL からの応答バイト → 読み取り側へ push
    this.ws.on('message', (data) => {
      this.push(Buffer.isBuffer(data) ? data : Buffer.from(data));
    });

    this.ws.on('close', () => this.push(null));
    this.ws.on('error', (err) => this.destroy(err));
  }

  _read() {} // push 駆動なので何もしない

  // mysql2 が書いたバイト（MySQLプロトコル）→ WebSocket へ送る
  _write(chunk, _enc, cb) {
    if (this._open) this.ws.send(chunk, cb);
    else this._queue.push({ chunk, cb });
  }

  _final(cb) {
    try { this.ws.close(); } catch {}
    cb();
  }

  // --- mysql2 は stream を net.Socket とみなして以下を呼ぶことがあるので no-op スタブ ---
  setNoDelay() { return this; }
  setTimeout() { return this; }
  setKeepAlive() { return this; }
  ref() { return this; }
  unref() { return this; }
}
