import crypto from 'crypto';

/**
 * 產生綠界 CheckMacValue
 * 1. 將參數依照字母順序排序 (A-Z)
 * 2. 組合字串：HashKey=...&參數1=...&參數2=...&HashIV=...
 * 3. URL Encode
 * 4. 轉小寫
 * 5. 取 SHA256 加密
 * 6. 轉大寫
 * 
 * @param {Object} params - 綠界送出的所有參數
 * @param {string} hashKey - 綠界提供之 HashKey
 * @param {string} hashIV - 綠界提供之 HashIV
 * @returns {string} - 加密後的 CheckMacValue
 */
export function generateCheckMacValue(params, hashKey, hashIV) {
    // 1. 排除 CheckMacValue 並排序 Key
    const sortedKeys = Object.keys(params)
        .filter(key => key !== 'CheckMacValue')
        .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

    // 2. 組合字串
    let rawString = `HashKey=${hashKey}`;
    sortedKeys.forEach(key => {
        rawString += `&${key}=${params[key]}`;
    });
    rawString += `&HashIV=${hashIV}`;

    // 3. URL Encode (注意：綠界要求的 encode 方式比較特殊)
    // 需要將特定字元轉換為綠界要求的格式
    let encodedString = encodeURIComponent(rawString)
        .replace(/%20/g, '+')
        .replace(/%21/g, '!')
        .replace(/%28/g, '(')
        .replace(/%29/g, ')')
        .replace(/%2a/g, '*') // 綠界要求星號為小寫，但 encodeURIComponent 可能會是大寫
        .replace(/%2A/g, '*');

    // 4. 轉小寫
    const lowerString = encodedString.toLowerCase();

    // 5. SHA256 加密
    const sha256 = crypto.createHash('sha256').update(lowerString).digest('hex');

    // 6. 轉大寫
    return sha256.toUpperCase();
}

/**
 * 產生跳轉綠界的 HTML Form
 * @param {string} actionUrl - 綠界 API 地址 (測試或正式)
 * @param {Object} params - 包含 CheckMacValue 的所有參數
 */
export function generateHtmlForm(actionUrl, params) {
    let formHtml = `<form id="ecpay-form" method="POST" action="${actionUrl}">`;
    for (const [key, value] of Object.entries(params)) {
        formHtml += `<input type="hidden" name="${key}" value="${value}" />`;
    }
    formHtml += `</form><script>document.getElementById("ecpay-form").submit();</script>`;
    return formHtml;
}
