<?php
// Verso waitlist: stores sign-ups in a CSV outside the public web root.
header('Content-Type: application/json');
header('X-Robots-Tag: noindex');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo '{"ok":false}'; exit; }
$raw = file_get_contents('php://input', false, null, 0, 4096);
$d = json_decode($raw, true);
if (!is_array($d)) { http_response_code(400); echo '{"ok":false}'; exit; }
if (!empty($d['hp'])) { echo '{"ok":true}'; exit; } // honeypot: pretend success for bots
$email = strtolower(trim((string)($d['email'] ?? '')));
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 200) { http_response_code(422); echo '{"ok":false,"error":"email"}'; exit; }
$clean = function ($s, $max = 40) { return substr(preg_replace('/[^a-z0-9_-]/i', '', (string)$s), 0, $max); };
$make = array_slice(array_map($clean, is_array($d['make'] ?? null) ? $d['make'] : []), 0, 8);
$os = $clean($d['os'] ?? '', 12);
$lang = $clean($d['lang'] ?? 'en', 8);
$dir = dirname(__DIR__) . '/waitlist-data';
if (!is_dir($dir)) { mkdir($dir, 0700, true); }
$file = $dir . '/waitlist.csv';
// Simple per-IP throttle: at most 20 sign-ups per IP per hour.
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
$tf = $dir . '/throttle-' . md5($ip . date('YmdH'));
$n = (int)@file_get_contents($tf);
if ($n >= 20) { http_response_code(429); echo '{"ok":false}'; exit; }
@file_put_contents($tf, (string)($n + 1));
$fh = fopen($file, 'c+');
if (!$fh || !flock($fh, LOCK_EX)) { http_response_code(500); echo '{"ok":false}'; exit; }
$rows = [];
while (($r = fgetcsv($fh)) !== false) { if ($r[0] !== 'email') $rows[$r[0]] = $r; }
$prev = $rows[$email] ?? null;
$rows[$email] = [$email, implode('|', $make ?: ($prev ? explode('|', $prev[1]) : [])), $os ?: ($prev[2] ?? ''), $lang, $prev[4] ?? gmdate('c'), gmdate('c')];
ftruncate($fh, 0); rewind($fh);
fputcsv($fh, ['email', 'makes', 'os', 'lang', 'joined_at', 'updated_at']);
foreach ($rows as $r) fputcsv($fh, $r);
fflush($fh); flock($fh, LOCK_UN); fclose($fh);
echo '{"ok":true}';
