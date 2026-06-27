$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function T([string]$s) {
    return [regex]::Unescape($s)
}

$Root = Split-Path -Parent $PSScriptRoot
$Port = 80
$LocalUrl = "http://localhost"
$LogFile = Join-Path $Root "site-start.log"
$ServerLog = Join-Path $Root "site-server.log"
$Runner = Join-Path $env:TEMP "guangxing-run-server.ps1"

$identity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($identity)
$isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Clear-Host
    Write-Host ""
    Write-Host (T "\u5ee3\u884c\u5bae\u7db2\u7ad9\u555f\u52d5\u5668") -ForegroundColor Yellow
    Write-Host (T "\u6b64\u7db2\u7ad9\u4f7f\u7528 80 \u57e0\uff0c\u9700\u8981\u7cfb\u7d71\u7ba1\u7406\u54e1\u6b0a\u9650\u3002") -ForegroundColor Cyan
    Write-Host (T "\u6b63\u5728\u91cd\u65b0\u958b\u555f\u7ba1\u7406\u54e1\u8996\u7a97\uff0c\u8acb\u6309 Windows \u8df3\u51fa\u7684\u300c\u662f\u300d\u3002") -ForegroundColor Cyan
    Start-Process powershell -Verb RunAs -WorkingDirectory $Root -ArgumentList "-NoProfile -ExecutionPolicy Bypass -NoExit -File `"$PSCommandPath`""
    Start-Sleep -Seconds 2
    exit
}

function Line {
    Write-Host "------------------------------------------------------------" -ForegroundColor DarkGray
}

function Banner {
    Clear-Host
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Yellow
    Write-Host ("            " + (T "\u5ee3 \u884c \u5bae \u7db2 \u7ad9 \u555f \u52d5 \u5668")) -ForegroundColor Yellow
    Write-Host "            CHI FU CMS  Local Website Service" -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Yellow
    Write-Host ""
}

function Add-Log([string]$Text) {
    $stamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -LiteralPath $LogFile -Encoding UTF8 -Value "[$stamp] $Text"
}

function Step([string]$Text) {
    Write-Host ("  [" + (T "\u9032\u884c\u4e2d") + "] $Text...") -ForegroundColor Cyan
    Add-Log "[RUN] $Text"
}

function Ok([string]$Text) {
    Write-Host ("  [" + (T "\u5b8c\u6210") + "] $Text") -ForegroundColor Green
    Add-Log "[OK] $Text"
}

function Fail([string]$Where, [string]$Reason) {
    Add-Log "[FAIL AT] $Where"
    Add-Log "[REASON] $Reason"
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host ("                    " + (T "\u555f \u52d5 \u5931 \u6557")) -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host ("  " + (T "\u5931\u6557\u4f4d\u7f6e\uff1a") + $Where) -ForegroundColor Yellow
    Write-Host ("  " + (T "\u932f\u8aa4\u539f\u56e0\uff1a") + $Reason) -ForegroundColor Red
    Write-Host ""
    Write-Host ("  " + (T "\u555f\u52d5\u7d00\u9304\uff1a") + $LogFile) -ForegroundColor Gray
    Write-Host ("  " + (T "\u670d\u52d9\u7d00\u9304\uff1a") + $ServerLog) -ForegroundColor Gray
    Write-Host ""
    if (Test-Path -LiteralPath $LogFile) {
        Write-Host ("  " + (T "\u6700\u8fd1\u7d00\u9304\uff1a")) -ForegroundColor DarkGray
        Get-Content -LiteralPath $LogFile -Tail 18
    }
    Write-Host ""
    Read-Host (T "\u6309 Enter \u95dc\u9589")
    exit 1
}

function Run-Step([string]$Where, [scriptblock]$Action) {
    try {
        & $Action
    } catch {
        Fail $Where $_.Exception.Message
    }
}

Set-Location -LiteralPath $Root
Banner

"==================================================" | Set-Content -LiteralPath $LogFile -Encoding UTF8
Add-Log "Guangxing site starter"
Add-Log "Project folder: $Root"

Line
Write-Host ("  " + (T "\u5c08\u6848\u4f4d\u7f6e\uff1a") + $Root)
Write-Host ("  " + (T "\u555f\u52d5\u7d00\u9304\uff1a") + $LogFile)
Write-Host ("  " + (T "\u670d\u52d9\u7d00\u9304\uff1a") + $ServerLog)
Line
Write-Host ""

Run-Step (T "\u6aa2\u67e5 Node.js") {
    Step (T "\u6aa2\u67e5 Node.js")
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw (T "\u627e\u4e0d\u5230 Node.js\uff0c\u8acb\u5148\u5b89\u88dd Node.js 18 \u4ee5\u4e0a\u7248\u672c\u3002")
    }
    Ok (T "Node.js \u5df2\u627e\u5230")
}

Run-Step (T "\u6aa2\u67e5 npm") {
    Step (T "\u6aa2\u67e5 npm")
    if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
        throw (T "\u627e\u4e0d\u5230 npm\uff0c\u8acb\u91cd\u65b0\u5b89\u88dd Node.js \u6216\u78ba\u8a8d npm \u5df2\u52a0\u5165 PATH\u3002")
    }
    Ok (T "npm \u5df2\u627e\u5230")
}

Run-Step (T "\u5b89\u88dd\u5957\u4ef6") {
    if (-not (Test-Path -LiteralPath (Join-Path $Root "node_modules"))) {
        Step (T "\u5b89\u88dd\u5957\u4ef6")
        Add-Log "npm install"
        cmd.exe /d /c "npm.cmd install >> ""$LogFile"" 2>&1"
        if ($LASTEXITCODE -ne 0) { throw (T "\u5957\u4ef6\u5b89\u88dd\u5931\u6557\uff0c\u8acb\u67e5\u770b\u555f\u52d5\u7d00\u9304\u3002") }
        Ok (T "\u5957\u4ef6\u5b89\u88dd\u5b8c\u6210")
    } else {
        Ok (T "\u5957\u4ef6\u5df2\u5b58\u5728\uff0c\u7565\u904e\u5b89\u88dd")
    }
}

Run-Step (T "\u6e96\u5099 SQLite \u8cc7\u6599\u5eab") {
    Step (T "\u6e96\u5099 SQLite \u8cc7\u6599\u5eab")
    Add-Log "node tools\db-tool.cjs init-sqlite"
    cmd.exe /d /c "node tools\db-tool.cjs init-sqlite >> ""$LogFile"" 2>&1"
    if ($LASTEXITCODE -ne 0) { throw (T "SQLite \u521d\u59cb\u5316\u5931\u6557\uff0c\u8acb\u67e5\u770b\u555f\u52d5\u7d00\u9304\u3002") }
    Ok (T "SQLite \u8cc7\u6599\u5eab\u5b8c\u6210")
}

Run-Step (T "\u6aa2\u67e5\u7db2\u7ad9\u57e0\u865f") {
    Step ((T "\u6aa2\u67e5\u7db2\u7ad9\u57e0\u865f ") + $Port)
    $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    foreach ($listener in $listeners) {
        if ($listener.OwningProcess -and $listener.OwningProcess -ne 0) {
            Add-Log "Kill old process PID $($listener.OwningProcess)"
            Stop-Process -Id $listener.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
    $stillUsed = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($stillUsed) {
        throw (T "80 \u57e0\u4ecd\u88ab\u5360\u7528\u3002\u82e5 PID \u662f 4 \u6216 System\uff0c\u8acb\u95dc\u9589 IIS / World Wide Web Publishing Service\u3002")
    }
    Ok (T "80 \u57e0\u53ef\u4f7f\u7528")
}

Run-Step (T "\u8a2d\u5b9a Windows \u9632\u706b\u7246") {
    Step (T "\u8a2d\u5b9a Windows \u9632\u706b\u7246")
    $ruleName = "Guangxing Temple Website Port 80"
    $rule = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
    if (-not $rule) {
        New-NetFirewallRule -DisplayName $ruleName -Direction Inbound -Action Allow -Protocol TCP -LocalPort $Port | Out-Null
        Ok (T "\u9632\u706b\u7246\u5df2\u5141\u8a31 80 \u57e0")
    } else {
        Ok (T "\u9632\u706b\u7246\u898f\u5247\u5df2\u5b58\u5728")
    }
}

Run-Step (T "\u6253\u5305\u7db2\u7ad9") {
    Step (T "\u6253\u5305\u7db2\u7ad9")
    Add-Log "npm run build"
    cmd.exe /d /c "npm.cmd run build >> ""$LogFile"" 2>&1"
    if ($LASTEXITCODE -ne 0) { throw (T "\u7db2\u7ad9\u6253\u5305\u5931\u6557\uff0c\u8acb\u67e5\u770b\u555f\u52d5\u7d00\u9304\u3002") }
    Ok (T "\u7db2\u7ad9\u6253\u5305\u5b8c\u6210")
}

Run-Step (T "\u53d6\u5f97\u9023\u7dda\u7db2\u5740") {
    Step (T "\u53d6\u5f97\u9023\u7dda\u7db2\u5740")
    $script:LanIp = (Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and $_.AddressState -eq "Preferred" } |
        Select-Object -First 1 -ExpandProperty IPAddress)
    if (-not $script:LanIp) { $script:LanIp = T "\u7121\u6cd5\u53d6\u5f97" }
    try {
        $script:PublicIp = (Invoke-RestMethod -Uri "https://api.ipify.org" -TimeoutSec 5).Trim()
    } catch {
        $script:PublicIp = T "\u7121\u6cd5\u53d6\u5f97"
    }
    Ok (T "\u7db2\u5740\u8cc7\u8a0a\u53d6\u5f97\u5b8c\u6210")
}

Run-Step (T "\u555f\u52d5\u7db2\u7ad9\u670d\u52d9") {
    Step (T "\u555f\u52d5\u7db2\u7ad9\u670d\u52d9")
    if (Test-Path -LiteralPath $ServerLog) { Remove-Item -LiteralPath $ServerLog -Force }

@"
`$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Set-Location -LiteralPath "$Root"
`$env:PORT = "$Port"
`$env:PUBLIC_BASE_URL = "$LocalUrl"
`$env:FRONTEND_BASE_URL = "$LocalUrl"
`$Host.UI.RawUI.WindowTitle = "Guangxing Website Service"
Clear-Host
Write-Host ""
Write-Host ([regex]::Unescape("\u5ee3\u884c\u5bae\u7db2\u7ad9\u670d\u52d9\u57f7\u884c\u4e2d\uff0c\u8acb\u4e0d\u8981\u95dc\u9589\u6b64\u8996\u7a97\u3002")) -ForegroundColor Cyan
Write-Host "Website: $LocalUrl" -ForegroundColor Green
Write-Host "Log: $ServerLog" -ForegroundColor Gray
Write-Host ""
node server\server.js *>> "$ServerLog"
Write-Host ""
Write-Host ([regex]::Unescape("\u7db2\u7ad9\u670d\u52d9\u5df2\u505c\u6b62\uff0c\u8acb\u67e5\u770b\u670d\u52d9\u7d00\u9304\u3002")) -ForegroundColor Yellow
Read-Host "Enter"
"@ | Set-Content -LiteralPath $Runner -Encoding UTF8

    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -NoExit -File `"$Runner`"" -WindowStyle Minimized
    Ok (T "\u7db2\u7ad9\u670d\u52d9\u8996\u7a97\u5df2\u958b\u555f")
}

Run-Step (T "\u7b49\u5f85\u670d\u52d9\u5b8c\u6210\u555f\u52d5") {
    Step (T "\u7b49\u5f85\u670d\u52d9\u5b8c\u6210\u555f\u52d5")
    $ready = $false
    for ($i = 1; $i -le 25; $i++) {
        try {
            $health = Invoke-RestMethod -Uri "$LocalUrl/api/health" -TimeoutSec 2
            if ($health.ok -and $health.ready) {
                $ready = $true
                break
            }
        } catch {}
        Start-Sleep -Seconds 1
    }
    if (-not $ready) {
        if (Test-Path -LiteralPath $ServerLog) {
            Add-Log "Server log tail:"
            Get-Content -LiteralPath $ServerLog -Tail 30 | Add-Content -LiteralPath $LogFile -Encoding UTF8
        }
        throw (T "\u7db2\u7ad9\u670d\u52d9\u6c92\u6709\u6210\u529f\u56de\u61c9\uff0c\u8acb\u67e5\u770b\u670d\u52d9\u7d00\u9304\u3002")
    }
    Ok (T "\u7db2\u7ad9\u670d\u52d9\u555f\u52d5\u5b8c\u6210")
}

Start-Process $LocalUrl

Banner
Write-Host "============================================================" -ForegroundColor Green
Write-Host ("                    " + (T "\u555f \u52d5 \u5b8c \u6210")) -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host ("  " + (T "\u672c\u6a5f\u7db2\u5740\uff1a  ") + $LocalUrl) -ForegroundColor White
if ($LanIp -ne (T "\u7121\u6cd5\u53d6\u5f97")) {
    Write-Host ("  " + (T "\u5167\u7db2\u7db2\u5740\uff1a  ") + "http://$LanIp") -ForegroundColor White
} else {
    Write-Host ("  " + (T "\u5167\u7db2\u7db2\u5740\uff1a  \u7121\u6cd5\u53d6\u5f97")) -ForegroundColor DarkYellow
}
if ($PublicIp -ne (T "\u7121\u6cd5\u53d6\u5f97")) {
    Write-Host ("  " + (T "\u5916\u7db2\u7db2\u5740\uff1a  ") + "http://$PublicIp") -ForegroundColor White
} else {
    Write-Host ("  " + (T "\u5916\u7db2\u7db2\u5740\uff1a  \u7121\u6cd5\u53d6\u5f97")) -ForegroundColor DarkYellow
}
Write-Host ""
Write-Host ("  " + (T "\u72c0\u614b\uff1a\u7db2\u7ad9\u8207\u8cc7\u6599\u5eab\u5df2\u555f\u52d5\u5b8c\u6210")) -ForegroundColor Green
Write-Host ("  " + (T "\u8cc7\u6599\u5eab\uff1aSQLite\uff0c\u672c\u6a5f\u8cc7\u6599\u5eab data\\guangxing.sqlite")) -ForegroundColor Gray
Write-Host ("  " + (T "\u555f\u52d5\u7d00\u9304\uff1a") + $LogFile) -ForegroundColor Gray
Write-Host ("  " + (T "\u670d\u52d9\u7d00\u9304\uff1a") + $ServerLog) -ForegroundColor Gray
Write-Host ""
Write-Host ("  " + (T "\u63d0\u9192\uff1a\u5916\u7db2\u7db2\u5740\u8981\u80fd\u9023\u9032\u4f86\uff0c\u8def\u7531\u5668\u9700\u8a2d\u5b9a 80 \u57e0\u8f49\u767c\u5230\u672c\u6a5f\u3002")) -ForegroundColor Yellow
Write-Host ("        " + (T "Windows \u9632\u706b\u7246\u4e5f\u5fc5\u9808\u5141\u8a31 80 \u57e0\u3002")) -ForegroundColor Yellow
Write-Host ""
Line
Write-Host ("  " + (T "\u8acb\u4e0d\u8981\u95dc\u9589\u300c\u5ee3\u884c\u5bae\u7db2\u7ad9\u670d\u52d9\u300d\u8996\u7a97\uff0c\u95dc\u9589\u5f8c\u7db2\u7ad9\u6703\u505c\u6b62\u3002"))
Line
Read-Host (T "\u6309 Enter \u95dc\u9589\u672c\u555f\u52d5\u8cc7\u8a0a\u8996\u7a97")
