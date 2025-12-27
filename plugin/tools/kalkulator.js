const { sleep, reactLoading } = require("../../lib/helperAnimasi");

module.exports = {
  command: ["kalkulator"],
  category: "tool",
  description: "Kalkulator matematika dengan berbagai operasi",
  async execute(bot, m, args) {
    const remoteJid = m.key.remoteJid;
    
    // Jika tidak ada argumen, tampilkan menu bantuan
    if (args.length === 0) {
      return bot.sendMessage(
        remoteJid,
        { 
          text: `🧮 *KALKULATOR MATEMATIKA*\n\n` +
                `*Cara penggunaan:*\n` +
                `.calc [operasi] [angka1] [angka2]\n` +
                `.calc [ekspresi matematika]\n\n` +
                `*Operasi dasar:*\n` +
                `➕ Penjumlahan: .calc + 10 5\n` +
                `➖ Pengurangan: .calc - 10 5\n` +
                `✖️ Perkalian: .calc * 10 5\n` +
                `➗ Pembagian: .calc / 10 5\n` +
                `🔢 Modulus: .calc % 10 3\n` +
                `💪 Pangkat: .calc ^ 2 3\n\n` +
                `*Operasi lanjutan:*\n` +
                `√ Akar kuadrat: .calc sqrt 16\n` +
                `📐 Sinus: .calc sin 30\n` +
                `📐 Cosinus: .calc cos 60\n` +
                `📐 Tangen: .calc tan 45\n` +
                `📊 Persentase: .calc %of 50 200\n\n` +
                `*Contoh ekspresi:*\n` +
                `.calc 10 + 5 * 2\n` +
                `.calc (10 + 5) * 2\n` +
                `.calc sin(30) + cos(60)\n\n` +
                `📌 *Catatan:*\n` +
                `• Gunakan titik (.) untuk desimal\n` +
                `• Support bilangan negatif\n` +
                `• Support tanda kurung`
        },
        { quoted: m }
      );
    }
    // --- PANGGIL REACT LOADING DARI HELPER ---
      await reactLoading(bot, m); // otomatis pakai default 🔁🔃🔄
    try {
      // Gabungkan semua argumen menjadi string
      const input = args.join(" ");
      console.log(`[CALC] Calculating: ${input}`);
      
      // Kirim pesan sedang memproses
      await bot.sendMessage(
        remoteJid,
        { text: `⏳ Menghitung: \`${input}\`` },
        { quoted: m }
      );
      
      // Parse dan hitung
      let result;
      let operation = "perhitungan";
      
      // Cek jika input adalah ekspresi matematika lengkap
      if (args.length >= 3 && ['+', '-', '*', '/', '%', '^'].includes(args[0])) {
        // Format: .calc + 10 5
        result = calculateBasic(args[0], args[1], args[2]);
        operation = getOperationName(args[0]);
      } else if (args.length >= 2 && ['sqrt', 'sin', 'cos', 'tan', 'log'].includes(args[0].toLowerCase())) {
        // Format: .calc sqrt 16
        result = calculateAdvanced(args[0].toLowerCase(), args[1]);
        operation = getOperationName(args[0]);
      } else if (args[0].toLowerCase() === '%of' && args.length >= 3) {
        // Format: .calc %of 50 200
        result = calculatePercentage(args[1], args[2]);
        operation = "persentase";
      } else {
        // Format ekspresi matematika: .calc 10 + 5 * 2
        result = evaluateExpression(input);
        operation = "ekspresi matematika";
      }
      
      // Format hasil
      const formattedResult = formatResult(result);
      
      // Kirim hasil
      const resultText = `🧮 *HASIL PERHITUNGAN*\n\n` +
                        `*Input:* \`${input}\`\n` +
                        `*Operasi:* ${operation}\n` +
                        `*Hasil:* ${formattedResult}\n\n` +
                        `📊 *Detail:* ${formatDetailedResult(result)}`;
      
      await bot.sendMessage(
        remoteJid,
        { text: resultText },
        { quoted: m }
      );
      
      console.log(`[CALC] Result: ${result} for input: ${input}`);
      
    } catch (error) {
      console.error('[CALC] Error:', error);
      
      let errorMessage = "❌ Gagal menghitung!";
      
      if (error.message.includes("invalid") || error.message.includes("NaN")) {
        errorMessage = "❌ Input tidak valid! Pastikan format angka benar.";
      } else if (error.message.includes("division by zero")) {
        errorMessage = "❌ Tidak bisa membagi dengan nol!";
      } else if (error.message.includes("syntax")) {
        errorMessage = "❌ Syntax error! Periksa format input.";
      } else if (error.message.includes("undefined")) {
        errorMessage = "❌ Operasi tidak dikenali!";
      }
      
      return bot.sendMessage(
        remoteJid,
        { 
          text: `${errorMessage}\n\n` +
                `Contoh: .calc + 10 5\n` +
                `Gunakan .calc untuk melihat panduan lengkap.`
        },
        { quoted: m }
      );
    }
  }
};

// ===== FUNGSI PERHITUNGAN DASAR =====
function calculateBasic(operator, num1, num2) {
  const a = parseFloat(num1);
  const b = parseFloat(num2);
  
  if (isNaN(a) || isNaN(b)) {
    throw new Error("Invalid number");
  }
  
  switch (operator) {
    case '+':
      return a + b;
    case '-':
      return a - b;
    case '*':
    case 'x':
    case '×':
      return a * b;
    case '/':
    case '÷':
      if (b === 0) throw new Error("Division by zero");
      return a / b;
    case '%':
      return a % b;
    case '^':
    case '**':
      return Math.pow(a, b);
    default:
      throw new Error("Unknown operator");
  }
}

// ===== FUNGSI PERHITUNGAN LANJUT =====
function calculateAdvanced(func, num) {
  const n = parseFloat(num);
  
  if (isNaN(n)) {
    throw new Error("Invalid number");
  }
  
  switch (func.toLowerCase()) {
    case 'sqrt':
      if (n < 0) throw new Error("Cannot sqrt negative number");
      return Math.sqrt(n);
    case 'sin':
      return Math.sin(n * Math.PI / 180); // Convert to radians
    case 'cos':
      return Math.cos(n * Math.PI / 180);
    case 'tan':
      return Math.tan(n * Math.PI / 180);
    case 'log':
      if (n <= 0) throw new Error("Cannot log non-positive number");
      return Math.log10(n);
    case 'ln':
      if (n <= 0) throw new Error("Cannot ln non-positive number");
      return Math.log(n);
    case 'abs':
      return Math.abs(n);
    case 'floor':
      return Math.floor(n);
    case 'ceil':
      return Math.ceil(n);
    case 'round':
      return Math.round(n);
    default:
      throw new Error("Unknown function");
  }
}

// ===== FUNGSI PERSENTASE =====
function calculatePercentage(value, total) {
  const v = parseFloat(value);
  const t = parseFloat(total);
  
  if (isNaN(v) || isNaN(t)) {
    throw new Error("Invalid number");
  }
  
  if (t === 0) throw new Error("Total cannot be zero");
  
  const percentage = (v / t) * 100;
  const resultValue = (v / 100) * t;
  
  return {
    percentage: percentage,
    value: resultValue,
    original: { value: v, total: t }
  };
}

// ===== FUNGSI EVALUASI EKSPRESI =====
function evaluateExpression(expr) {
  try {
    // Replace operator untuk JavaScript
    let safeExpr = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/\^/g, '**')
      .replace(/sqrt\(/g, 'Math.sqrt(')
      .replace(/sin\(/g, 'Math.sin(')
      .replace(/cos\(/g, 'Math.cos(')
      .replace(/tan\(/g, 'Math.tan(')
      .replace(/log\(/g, 'Math.log10(')
      .replace(/ln\(/g, 'Math.log(')
      .replace(/abs\(/g, 'Math.abs(')
      .replace(/floor\(/g, 'Math.floor(')
      .replace(/ceil\(/g, 'Math.ceil(')
      .replace(/round\(/g, 'Math.round(')
      .replace(/pi/g, 'Math.PI')
      .replace(/e/g, 'Math.E');
    
    // Validasi: hanya karakter aman yang diperbolehkan
    const safeChars = /^[0-9+\-*/.()%\s\[\],eEπPIsincostanlogabfloorexpqrt\d\s]+$/;
    if (!safeChars.test(safeExpr)) {
      throw new Error("Invalid characters in expression");
    }
    
    // Evaluasi menggunakan Function untuk safety
    const result = Function('"use strict"; return (' + safeExpr + ')')();
    
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      throw new Error("Invalid result");
    }
    
    return result;
    
  } catch (error) {
    console.error('[CALC] Expression error:', error);
    throw new Error("Invalid mathematical expression");
  }
}

// ===== FUNGSI HELPER =====
function getOperationName(op) {
  const operations = {
    '+': 'penjumlahan',
    '-': 'pengurangan',
    '*': 'perkalian',
    '/': 'pembagian',
    '%': 'modulus',
    '^': 'pangkat',
    'sqrt': 'akar kuadrat',
    'sin': 'sinus',
    'cos': 'cosinus',
    'tan': 'tangen',
    'log': 'logaritma',
    'ln': 'logaritma natural',
    'abs': 'nilai absolut',
    'floor': 'pembulatan ke bawah',
    'ceil': 'pembulatan ke atas',
    'round': 'pembulatan',
    '%of': 'persentase'
  };
  
  return operations[op.toLowerCase()] || op;
}

function formatResult(result) {
  if (typeof result === 'object' && result.percentage !== undefined) {
    // Format untuk persentase
    return `${result.percentage.toFixed(2)}% (${result.value.toFixed(2)} dari ${result.original.total})`;
  }
  
  // Format angka biasa
  const num = parseFloat(result);
  
  // Cek jika hasil desimal
  if (Math.abs(num - Math.round(num)) > 0.000001) {
    // Tampilkan 6 digit desimal maksimal
    return num.toFixed(6).replace(/\.?0+$/, '');
  }
  
  // Angka bulat
  return num.toString();
}

function formatDetailedResult(result) {
  if (typeof result === 'object' && result.percentage !== undefined) {
    return `${result.original.value} adalah ${result.percentage.toFixed(2)}% dari ${result.original.total}`;
  }
  
  const num = parseFloat(result);
  
  // Tambahkan format tambahan
  let details = [];
  
  if (num >= 1000000) {
    details.push(`${(num / 1000000).toFixed(2)} juta`);
  } else if (num >= 1000) {
    details.push(`${(num / 1000).toFixed(2)} ribu`);
  }
  
  if (num < 0) {
    details.push(`negatif ${Math.abs(num)}`);
  }
  
  if (Number.isInteger(num)) {
    details.push(`bilangan bulat`);
  } else {
    details.push(`bilangan desimal`);
  }
  
  if (num === 0) {
    details.push(`nol`);
  } else if (num === 1) {
    details.push(`satu`);
  }
  
  return details.length > 0 ? details.join(', ') : `angka ${num}`;
}

// ===== COMMAND TAMBAHAN UNTUK KONVERSI =====
module.exports.convertUnits = async function(bot, m, args) {
  const remoteJid = m.key.remoteJid;
  
  if (args.length < 4) {
    return bot.sendMessage(
      remoteJid,
      {
        text: `📐 *KONVERSI SATUAN*\n\n` +
              `*Cara penggunaan:*\n` +
              `.convert [nilai] [dari] [ke]\n\n` +
              `*Contoh:*\n` +
              `.convert 100 cm m\n` +
              `.convert 1 km mile\n` +
              `.convert 1000 gram kg\n` +
              `.convert 25 celcius fahrenheit\n\n` +
              `*Satuan tersedia:*\n` +
              `• Panjang: mm, cm, m, km, inch, foot, mile\n` +
              `• Berat: mg, g, kg, ounce, pound\n` +
              `• Suhu: celcius, fahrenheit, kelvin\n` +
              `• Mata Uang: IDR, USD, EUR (perlu API)`
      },
      { quoted: m }
    );
  }
  
  try {
    const value = parseFloat(args[0]);
    const fromUnit = args[1].toLowerCase();
    const toUnit = args[2].toLowerCase();
    
    if (isNaN(value)) {
      throw new Error("Nilai harus angka");
    }
    
    const result = convertUnit(value, fromUnit, toUnit);
    
    const resultText = `📐 *HASIL KONVERSI*\n\n` +
                      `*Nilai:* ${value} ${fromUnit}\n` +
                      `*Konversi ke:* ${toUnit}\n` +
                      `*Hasil:* ${result.toFixed(6)} ${toUnit}\n\n` +
                      `📊 ${value} ${fromUnit} = ${result} ${toUnit}`;
    
    await bot.sendMessage(
      remoteJid,
      { text: resultText },
      { quoted: m }
    );
    
  } catch (error) {
    console.error('[CONVERT] Error:', error);
    await bot.sendMessage(
      remoteJid,
      { text: `❌ ${error.message || "Gagal konversi!"}` },
      { quoted: m }
    );
  }
};

function convertUnit(value, from, to) {
  // Konversi panjang
  const lengthUnits = {
    mm: 1,
    cm: 10,
    m: 1000,
    km: 1000000,
    inch: 25.4,
    foot: 304.8,
    mile: 1609344
  };
  
  // Konversi berat
  const weightUnits = {
    mg: 1,
    g: 1000,
    kg: 1000000,
    ounce: 28349.5,
    pound: 453592
  };
  
  // Konversi suhu
  if (['celcius', 'celsius', 'c'].includes(from) && ['fahrenheit', 'f'].includes(to)) {
    return (value * 9/5) + 32;
  }
  if (['fahrenheit', 'f'].includes(from) && ['celcius', 'celsius', 'c'].includes(to)) {
    return (value - 32) * 5/9;
  }
  if (['celcius', 'celsius', 'c'].includes(from) && ['kelvin', 'k'].includes(to)) {
    return value + 273.15;
  }
  if (['kelvin', 'k'].includes(from) && ['celcius', 'celsius', 'c'].includes(to)) {
    return value - 273.15;
  }
  if (['fahrenheit', 'f'].includes(from) && ['kelvin', 'k'].includes(to)) {
    return (value - 32) * 5/9 + 273.15;
  }
  if (['kelvin', 'k'].includes(from) && ['fahrenheit', 'f'].includes(to)) {
    return (value - 273.15) * 9/5 + 32;
  }
  
  // Cek satuan panjang
  if (lengthUnits[from] && lengthUnits[to]) {
    return (value * lengthUnits[from]) / lengthUnits[to];
  }
  
  // Cek satuan berat
  if (weightUnits[from] && weightUnits[to]) {
    return (value * weightUnits[from]) / weightUnits[to];
  }
  
  throw new Error(`Satuan ${from} ke ${to} tidak support`);
}

// Log saat module load
console.log('[CALC] Module loaded - Advanced Calculator ready');