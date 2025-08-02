// Helper functions to convert number to Vietnamese words
const chuHangDonVi = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
const chuHangChuc = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];

function docSo3ChuSo(baso: string): string {
    let tram: number, chuc: number, donvi: number;
    let KetQua = "";
    tram = parseInt(baso[0], 10);
    chuc = parseInt(baso[1], 10);
    donvi = parseInt(baso[2], 10);
    if (tram === 0 && chuc === 0 && donvi === 0) return "";
    if (tram !== 0) {
        KetQua += chuHangDonVi[tram] + " trăm";
        if ((chuc === 0) && (donvi !== 0)) KetQua += " linh";
    }
    if ((chuc !== 0) && (chuc !== 1)) {
        KetQua += " " + chuHangChuc[chuc];
        if ((chuc > 0) && (donvi === 1)) KetQua += " mốt";
        else if ((chuc > 0) && (donvi === 5)) KetQua += " lăm";
        else if ((chuc > 0) && (donvi !== 0)) KetQua += " " + chuHangDonVi[donvi];

    }
    if (chuc === 1) {
        KetQua += " mười";
        if (donvi === 5) {
            KetQua += " lăm";
        } else if (donvi !== 0) {
            KetQua += " " + chuHangDonVi[donvi];
        }
    }
    if(chuc === 0 && donvi > 0 && tram !== 0){
      KetQua += " " + chuHangDonVi[donvi];
    }
    if(chuc === 0 && donvi > 0 && tram === 0){
      KetQua = chuHangDonVi[donvi];
    }
    return KetQua.trim();
}


export function docTienBangChu(SoTien: number): string {
    const dvBlock = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
    if (SoTien === 0) return "Không";
    let str = String(SoTien);
    let i = 0;
    let arr = [];
    let index = str.length;
    let result: string[] = [];
    let rsString = '';

    while (index > 0) {
        arr.push(str.substring(index, Math.max(index - 3, 0)));
        index -= 3;
    }
    
    for (i = arr.length - 1; i >= 0; i--) {
        if (arr[i] !== '' && arr[i] !== '000') {
            result.push(docSo3ChuSo(arr[i].padStart(3, '0')));
            if (dvBlock[i]) {
                result.push(dvBlock[i]);
            }
        }
    }

    rsString = result.join(' ');
    rsString = rsString.replace(/\s+/g, ' ').trim();
    return rsString.charAt(0).toUpperCase() + rsString.slice(1);
}

export const timeSince = (date: string): string => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " năm trước";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " tháng trước";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " ngày trước";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " giờ trước";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " phút trước";
    return "vài giây trước";
};