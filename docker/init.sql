-- 初期化スクリプトを UTF-8 として解釈させる。
-- これが無いと公式イメージの mysql クライアントが latin1 で読み込み、
-- 日本語が二重エンコードされて保存される（mojibake の原因）。
SET NAMES utf8mb4;

USE demodb;

CREATE TABLE IF NOT EXISTS todos (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  task VARCHAR(255) NOT NULL,
  done TINYINT(1) NOT NULL DEFAULT 0
);

INSERT INTO todos (task, done) VALUES
  ('WebSocket経由でMySQLに接続する', 1),
  ('ソケット層の橋渡しを理解する', 1),
  ('本物のmysql2ドライバで検証する', 1),
  ('ビールを飲む', 0);
