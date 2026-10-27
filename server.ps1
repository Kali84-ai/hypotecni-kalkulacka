# Jednoduchý statický HTTP server pro hypoteční kalkulačku.
# Servíruje soubory ze složky ./public pouze na localhostu.
param(
    [int]$Port = 8080
)

$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot 'public'))
$rootSep = $root.TrimEnd('\') + '\'

$mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.ico'  = 'image/x-icon'
    '.txt'  = 'text/plain; charset=utf-8'
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Start()
Write-Host "Hypoteční kalkulačka běží na http://localhost:$Port/  (ukončení: Ctrl+C)"

try {
    while ($listener.IsListening) {
        $ctx = $listener.GetContext()
        $req = $ctx.Request
        $res = $ctx.Response
        try {
            $path = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath)
            if ($path -eq '/' -or $path -eq '') { $path = '/index.html' }
            $full = [System.IO.Path]::GetFullPath((Join-Path $root $path.TrimStart('/')))

            # Ochrana proti průchodu mimo složku public (../)
            if (-not $full.StartsWith($rootSep, [System.StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $full -PathType Leaf)) {
                $res.StatusCode = 404
                $bytes = [System.Text.Encoding]::UTF8.GetBytes('404 - Soubor nenalezen')
                $res.ContentType = 'text/plain; charset=utf-8'
            } else {
                $ext = [System.IO.Path]::GetExtension($full).ToLower()
                $res.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
                $res.Headers.Add('Cache-Control', 'no-cache')
                $bytes = [System.IO.File]::ReadAllBytes($full)
            }
            $res.ContentLength64 = $bytes.Length
            $res.OutputStream.Write($bytes, 0, $bytes.Length)
            Write-Host ("{0} {1} {2}" -f $req.HttpMethod, $req.Url.AbsolutePath, $res.StatusCode)
        } catch {
            # Např. neplatné znaky v cestě (* ? < >) – GetFullPath vyhodí výjimku
            $res.StatusCode = 400
        } finally {
            $res.OutputStream.Close()
        }
    }
} finally {
    $listener.Stop()
}
