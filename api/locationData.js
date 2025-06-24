/**
 * 한국 행정구역 좌표 데이터
 * 최종 업데이트: 2024-06-24
 * 데이터 기준: 행정안전부 공식 행정구역 정보
 */

export const locationCoordinates = {

    // ===== 서울특별시 데이터 시작 =====
    '서울': { lat: 37.5665, lon: 126.9780, name: '서울시', type: '광역자치단체', aliases: ['서울특별시', '서울'] },
    '서울시': { lat: 37.5665, lon: 126.9780, name: '서울시', type: '광역자치단체', aliases: ['서울특별시', '서울'] },

    // ===== 종로구 (행정동 및 그에 속하는 법정동) =====
    '종로구_서울': { lat: 37.5700, lon: 126.9760, name: '서울시 종로구', type: '기초자치단체' },
    '청운효자동': { lat: 37.5850, lon: 126.9690, name: '서울시 종로구 청운효자동', type: '행정동', contains_legal_divisions: ['청운동', '효자동', '신교동', '궁정동', '상촌동', '팔판동', '삼청동', '안국동', '사간동', '송현동'] },
    '사직동': { lat: 37.5750, lon: 126.9680, name: '서울시 종로구 사직동', type: '행정동', contains_legal_divisions: ['사직동', '내수동', '도렴동', '당주동', '내자동', '통의동', '적선동', '체부동', '필운동', '누하동', '옥인동', '통인동', '창성동'] },
    '삼청동': { lat: 37.5840, lon: 126.9800, name: '서울시 종로구 삼청동', type: '행정동', contains_legal_divisions: ['삼청동', '팔판동', '안국동', '사간동', '송현동'] },
    '평창동': { lat: 37.6100, lon: 126.9700, name: '서울시 종로구 평창동', type: '행정동', contains_legal_divisions: ['평창동', '구기동'] },
    '무악동': { lat: 37.5780, lon: 126.9580, name: '서울시 종로구 무악동', type: '행정동', contains_legal_divisions: ['무악동'] },
    '교남동': { lat: 37.5690, lon: 126.9610, name: '서울시 종로구 교남동', type: '행정동', contains_legal_divisions: ['교남동', '냉천동', '송월동', '홍파동'] },
    '가회동': { lat: 37.5800, lon: 126.9850, name: '서울시 종로구 가회동', type: '행정동', contains_legal_divisions: ['가회동', '재동', '계동', '원서동'] },
    '종로1.2.3.4가동': { lat: 37.5700, lon: 126.9850, name: '서울시 종로구 종로1.2.3.4가동', type: '행정동', contains_legal_divisions: ['종로1가', '종로2가', '종로3가', '종로4가', '청진동', '서린동', '수송동', '중학동', '공평동', '관철동', '인사동', '견지동', '와룡동', '운니동', '익선동', '경운동', '관훈동', '낙원동', '묘동', '돈의동', '장사동', '종로5가', '종로6가', '훈정동', '원남동', '연지동', '효제동', '충신동', '이화동', '동숭동', '혜화동'] },
    '종로5.6가동': { lat: 37.5700, lon: 126.9950, name: '서울시 종로구 종로5.6가동', type: '행정동', contains_legal_divisions: ['종로5가', '종로6가', '효제동', '충신동', '이화동', '연지동', '원남동', '훈정동'] },
    '이화동': { lat: 37.5780, lon: 127.0040, name: '서울시 종로구 이화동', type: '행정동', contains_legal_divisions: ['이화동', '동숭동'] },
    '혜화동': { lat: 37.5850, lon: 127.0000, name: '서울시 종로구 혜화동', type: '행정동', contains_legal_divisions: ['혜화동', '명륜1가', '명륜2가', '명륜3가', '명륜4가'] },
    '창신1동': { lat: 37.5700, lon: 127.0100, name: '서울시 종로구 창신1동', type: '행정동', contains_legal_divisions: ['창신동'] },
    '창신2동': { lat: 37.5720, lon: 127.0120, name: '서울시 종로구 창신2동', type: '행정동', contains_legal_divisions: ['창신동'] },
    '창신3동': { lat: 37.5740, lon: 127.0140, name: '서울시 종로구 창신3동', type: '행정동', contains_legal_divisions: ['창신동'] },
    '숭인1동': { lat: 37.5740, lon: 127.0170, name: '서울시 종로구 숭인1동', type: '행정동', contains_legal_divisions: ['숭인동'] },
    '숭인2동': { lat: 37.5760, lon: 127.0190, name: '서울시 종로구 숭인2동', type: '행정동', contains_legal_divisions: ['숭인동'] },

    // 종로구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '청운동': { lat: 37.5850, lon: 126.9690, name: '서울시 청운동', type: '법정동', admin_parent: '청운효자동' },
    '효자동': { lat: 37.5850, lon: 126.9690, name: '서울시 효자동', type: '법정동', admin_parent: '청운효자동' },
    '신교동': { lat: 37.5850, lon: 126.9690, name: '서울시 신교동', type: '법정동', admin_parent: '청운효자동' },
    '궁정동': { lat: 37.5850, lon: 126.9690, name: '서울시 궁정동', type: '법정동', admin_parent: '청운효자동' },
    '상촌동': { lat: 37.5850, lon: 126.9690, name: '서울시 상촌동', type: '법정동', admin_parent: '청운효자동' },
    '팔판동': { lat: 37.5840, lon: 126.9800, name: '서울시 팔판동', type: '법정동', admin_parent: '삼청동' },
    '안국동': { lat: 37.5840, lon: 126.9800, name: '서울시 안국동', type: '법정동', admin_parent: '삼청동' },
    '사간동': { lat: 37.5840, lon: 126.9800, name: '서울시 사간동', type: '법정동', admin_parent: '삼청동' },
    '송현동': { lat: 37.5840, lon: 126.9800, name: '서울시 송현동', type: '법정동', admin_parent: '삼청동' },
    '내수동': { lat: 37.5750, lon: 126.9680, name: '서울시 내수동', type: '법정동', admin_parent: '사직동' },
    '도렴동': { lat: 37.5750, lon: 126.9680, name: '서울시 도렴동', type: '법정동', admin_parent: '사직동' },
    '당주동': { lat: 37.5750, lon: 126.9680, name: '서울시 당주동', type: '법정동', admin_parent: '사직동' },
    '내자동': { lat: 37.5750, lon: 126.9680, name: '서울시 내자동', type: '법정동', admin_parent: '사직동' },
    '통의동': { lat: 37.5750, lon: 126.9680, name: '서울시 통의동', type: '법정동', admin_parent: '사직동' },
    '적선동': { lat: 37.5750, lon: 126.9680, name: '서울시 적선동', type: '법정동', admin_parent: '사직동' },
    '체부동': { lat: 37.5750, lon: 126.9680, name: '서울시 체부동', type: '법정동', admin_parent: '사직동' },
    '필운동': { lat: 37.5750, lon: 126.9680, name: '서울시 필운동', type: '법정동', admin_parent: '사직동' },
    '누하동': { lat: 37.5750, lon: 126.9680, name: '서울시 누하동', type: '법정동', admin_parent: '사직동' },
    '옥인동': { lat: 37.5750, lon: 126.9680, name: '서울시 옥인동', type: '법정동', admin_parent: '사직동' },
    '통인동': { lat: 37.5750, lon: 126.9680, name: '서울시 통인동', type: '법정동', admin_parent: '사직동' },
    '창성동': { lat: 37.5750, lon: 126.9680, name: '서울시 창성동', type: '법정동', admin_parent: '사직동' },
    '구기동': { lat: 37.6100, lon: 126.9700, name: '서울시 구기동', type: '법정동', admin_parent: '평창동' },
    '냉천동': { lat: 37.5690, lon: 126.9610, name: '서울시 냉천동', type: '법정동', admin_parent: '교남동' },
    '송월동_종로구': { lat: 37.5690, lon: 126.9610, name: '서울시 송월동', type: '법정동', admin_parent: '교남동' },
    '홍파동': { lat: 37.5690, lon: 126.9610, name: '서울시 홍파동', type: '법정동', admin_parent: '교남동' },
    '재동': { lat: 37.5800, lon: 126.9850, name: '서울시 재동', type: '법정동', admin_parent: '가회동' },
    '계동': { lat: 37.5800, lon: 126.9850, name: '서울시 계동', type: '법정동', admin_parent: '가회동' },
    '원서동': { lat: 37.5800, lon: 126.9850, name: '서울시 원서동', type: '법정동', admin_parent: '가회동' },
    '청진동': { lat: 37.5700, lon: 126.9850, name: '서울시 청진동', type: '법정동', admin_parent: '종로1.2.3.4가동' },
    '서린동': { lat: 37.5700, lon: 126.9850, name: '서울시 서린동', type: '법정동', admin_parent: '종로1.2.3.4가동' },
    '수송동': { lat: 37.5700, lon: 126.9850, name: '서울시 수송동', type: '법정동', admin_parent: '종로1.2.3.4가동' },
    '중학동': { lat: 37.5700, lon: 126.9850, name: '서울시 중학동', type: '법정동', admin_parent: '종로1.2.3.4가동' },
    '공평동': { lat: 37.5700, lon: 126.9850, name: '서울시 공평동', type: '법정동', admin_parent: '종로1.2.3.4가동' },
    '관철동': { lat: 37.5700, lon: 126.9850, name: '서울시 관철동', type: '법정동', admin_parent: '종로1.2.3.4가동' },
    '인사동': { lat: 37.5700, lon: 126.9850, name: '서울시 인사동', type: '법정동', admin_parent: '종로1.2.3.4가동' },
    '견지동': { lat: 37.5700, lon: 126.9850, name: '서울시 견지동', type: '법정동', admin_parent: '종로1.2.3.4가동' },
    '와룡동': { lat: 37.5700, lon: 126.9850, name: '서울시 와룡동', type: '법정동', admin_parent: '종로1.2.3.4가동' },
    '운니동': { lat: 37.5700, lon: 126.9850, name: '서울시 운니동', type: '법정동', admin_parent: '종로1.2.3.4가동' },
    '익선동': { lat: 37.5700, lon: 126.9850, name: '서울시 익선동', type: '법정동', admin_parent: '종로1.2.3.4가동' },
    '경운동': { lat: 37.5700, lon: 126.9850, name: '서울시 경운동', type: '법정동', admin_parent: '종로1.2.3.4가동' },
    '관훈동': { lat: 37.5700, lon: 126.9850, name: '서울시 관훈동', type: '법정동', admin_parent: '종로1.2.3.4가동' },
    '낙원동': { lat: 37.5700, lon: 126.9850, name: '서울시 낙원동', type: '법정동', admin_parent: '종로1.2.3.4가동' },
    '묘동': { lat: 37.5700, lon: 126.9850, name: '서울시 묘동', type: '법정동', admin_parent: '종로1.2.3.4가동' },
    '돈의동': { lat: 37.5700, lon: 126.9850, name: '서울시 돈의동', type: '법정동', admin_parent: '종로1.2.3.4가동' },
    '장사동': { lat: 37.5700, lon: 126.9850, name: '서울시 장사동', type: '법정동', admin_parent: '종로1.2.3.4가동' },
    '동숭동': { lat: 37.5780, lon: 127.0040, name: '서울시 동숭동', type: '법정동', admin_parent: '이화동_종로구' },
    '명륜1가': { lat: 37.5850, lon: 127.0000, name: '서울시 명륜1가', type: '법정동', admin_parent: '혜화동' },
    '명륜2가': { lat: 37.5850, lon: 127.0000, name: '서울시 명륜2가', type: '법정동', admin_parent: '혜화동' },
    '명륜3가': { lat: 37.5850, lon: 127.0000, name: '서울시 명륜3가', type: '법정동', admin_parent: '혜화동' },
    '명륜4가': { lat: 37.5850, lon: 127.0000, name: '서울시 명륜4가', type: '법정동', admin_parent: '혜화동' },
    '효제동': { lat: 37.5700, lon: 126.9950, name: '서울시 효제동', type: '법정동', admin_parent: '종로5.6가동' },
    '충신동': { lat: 37.5700, lon: 126.9950, name: '서울시 충신동', type: '법정동', admin_parent: '종로5.6가동' },
    '연지동': { lat: 37.5700, lon: 126.9950, name: '서울시 연지동', type: '법정동', admin_parent: '종로5.6가동' },
    '원남동': { lat: 37.5700, lon: 126.9950, name: '서울시 원남동', type: '법정동', admin_parent: '종로5.6가동' },
    '훈정동': { lat: 37.5700, lon: 126.9950, name: '서울시 훈정동', type: '법정동', admin_parent: '종로5.6가동' },


    // ===== 중구 (행정동 및 그에 속하는 법정동) =====
    '중구_서울': { lat: 37.5610, lon: 126.9970, name: '서울시 중구', type: '기초자치단체' },
    '소공동': { lat: 37.5640, lon: 126.9790, name: '서울시 중구 소공동', type: '행정동', contains_legal_divisions: ['소공동', '회현동1가', '회현동2가', '회현동3가', '남대문로1가', '남대문로2가', '남대문로3가', '남대문로4가', '남대문로5가', '북창동', '봉래동1가', '봉래동2가', '서소문동', '의주로1가', '의주로2가', '순화동', '정동'] },
    '회현동': { lat: 37.5580, lon: 126.9790, name: '서울시 중구 회현동', type: '행정동', contains_legal_divisions: ['회현동1가', '회현동2가', '회현동3가', '남대문로1가', '남대문로2가', '남대문로3가', '남대문로4가', '남대문로5가', '봉래동1가', '봉래동2가'] },
    '명동': { lat: 37.5610, lon: 126.9860, name: '서울시 중구 명동', type: '행정동', contains_legal_divisions: ['명동1가', '명동2가', '충무로1가', '충무로2가', '남산동1가', '남산동2가', '남산동3가', '저동1가', '저동2가', '을지로1가', '을지로2가', '을지로3가', '을지로4가', '수하동', '장교동', '삼각동', '다동', '무교동', '태평로1가', '태평로2가', '세종로', '신문로1가', '신문로2가'] },
    '필동': { lat: 37.5600, lon: 126.9960, name: '서울시 중구 필동', type: '행정동', contains_legal_divisions: ['필동1가', '필동2가', '필동3가', '남학동', '주자동', '예장동', '충무로3가', '충무로4가', '충무로5가'] },
    '장충동': { lat: 37.5570, lon: 127.0060, name: '서울시 중구 장충동', type: '행정동', contains_legal_divisions: ['장충동1가', '장충동2가', '묵정동', '필동2가', '충무로4가', '충무로5가'] },
    '광희동': { lat: 37.5640, lon: 127.0100, name: '서울시 중구 광희동', type: '행정동', contains_legal_divisions: ['광희동1가', '광희동2가', '쌍림동', '을지로6가', '을지로7가', '을지로8가'] },
    '신당동': { lat: 37.5640, lon: 127.0190, name: '서울시 중구 신당동', type: '행정동', contains_legal_divisions: ['신당동', '흥인동', '황학동'] },
    '다산동': { lat: 37.5560, lon: 127.0150, name: '서울시 중구 다산동', type: '행정동', contains_legal_divisions: ['다산동', '신당동', '흥인동', '황학동'] },
    '약수동': { lat: 37.5520, lon: 127.0130, name: '서울시 중구 약수동', type: '행정동', contains_legal_divisions: ['약수동', '신당동', '응봉동'] },
    '청구동': { lat: 37.5600, lon: 127.0090, name: '서울시 중구 청구동', type: '행정동', contains_legal_divisions: ['청구동', '신당동'] },
    '동화동': { lat: 37.5600, lon: 127.0160, name: '서울시 중구 동화동', type: '행정동', contains_legal_divisions: ['동화동', '신당동', '묵정동'] },
    '을지로동': { lat: 37.5650, lon: 126.9950, name: '서울시 중구 을지로동', type: '행정동', contains_legal_divisions: ['을지로1가', '을지로2가', '을지로3가', '을지로4가', '을지로5가', '을지로6가', '을지로7가', '을지로8가', '을지로9가', '을지로10가', '충무로1가', '충무로2가', '충무로3가', '충무로4가', '충무로5가', '명동', '남대문로1가', '남대문로2가', '남대문로3가', '남대문로4가', '남대문로5가', '무교동', '다동', '삼각동', '수하동', '장교동', '관철동', '인현동1가', '인현동2가', '초동', '방산동', '주교동', '오장동'] }, // 을지로동이 담당하는 법정동이 많음
    '신당5동': { lat: 37.5600, lon: 127.0250, name: '서울시 중구 신당5동', type: '행정동', contains_legal_divisions: ['신당동', '흥인동'] },

    // 중구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '회현동1가': { lat: 37.5580, lon: 126.9790, name: '서울시 회현동1가', type: '법정동', admin_parent: '회현동' },
    '회현동2가': { lat: 37.5580, lon: 126.9790, name: '서울시 회현동2가', type: '법정동', admin_parent: '회현동' },
    '회현동3가': { lat: 37.5580, lon: 126.9790, name: '서울시 회현동3가', type: '법정동', admin_parent: '회현동' },
    '남대문로1가': { lat: 37.5640, lon: 126.9790, name: '서울시 남대문로1가', type: '법정동', admin_parent: '소공동' },
    '남대문로2가': { lat: 37.5640, lon: 126.9790, name: '서울시 남대문로2가', type: '법정동', admin_parent: '소공동' },
    '남대문로3가': { lat: 37.5640, lon: 126.9790, name: '서울시 남대문로3가', type: '법정동', admin_parent: '소공동' },
    '남대문로4가': { lat: 37.5640, lon: 126.9790, name: '서울시 남대문로4가', type: '법정동', admin_parent: '소공동' },
    '남대문로5가': { lat: 37.5640, lon: 126.9790, name: '서울시 남대문로5가', type: '법정동', admin_parent: '소공동' },
    '북창동': { lat: 37.5640, lon: 126.9790, name: '서울시 북창동', type: '법정동', admin_parent: '소공동' },
    '봉래동1가': { lat: 37.5640, lon: 126.9790, name: '서울시 봉래동1가', type: '법정동', admin_parent: '소공동' },
    '봉래동2가': { lat: 37.5640, lon: 126.9790, name: '서울시 봉래동2가', type: '법정동', admin_parent: '소공동' },
    '서소문동': { lat: 37.5640, lon: 126.9790, name: '서울시 서소문동', type: '법정동', admin_parent: '소공동' },
    '의주로1가': { lat: 37.5640, lon: 126.9790, name: '서울시 의주로1가', type: '법정동', admin_parent: '소공동' },
    '의주로2가': { lat: 37.5640, lon: 126.9790, name: '서울시 의주로2가', type: '법정동', admin_parent: '소공동' },
    '순화동': { lat: 37.5640, lon: 126.9790, name: '서울시 순화동', type: '법정동', admin_parent: '소공동' },
    '정동': { lat: 37.5640, lon: 126.9790, name: '서울시 정동', type: '법정동', admin_parent: '소공동' },
    '명동1가': { lat: 37.5610, lon: 126.9860, name: '서울시 명동1가', type: '법정동', admin_parent: '명동' },
    '명동2가': { lat: 37.5610, lon: 126.9860, name: '서울시 명동2가', type: '법정동', admin_parent: '명동' },
    '충무로1가': { lat: 37.5610, lon: 126.9860, name: '서울시 충무로1가', type: '법정동', admin_parent: '명동' },
    '충무로2가': { lat: 37.5610, lon: 126.9860, name: '서울시 충무로2가', type: '법정동', admin_parent: '명동' },
    '남산동1가': { lat: 37.5610, lon: 126.9860, name: '서울시 남산동1가', type: '법정동', admin_parent: '명동' },
    '남산동2가': { lat: 37.5610, lon: 126.9860, name: '서울시 남산동2가', type: '법정동', admin_parent: '명동' },
    '남산동3가': { lat: 37.5610, lon: 126.9860, name: '서울시 남산동3가', type: '법정동', admin_parent: '명동' },
    '저동1가': { lat: 37.5610, lon: 126.9860, name: '서울시 저동1가', type: '법정동', admin_parent: '명동' },
    '저동2가': { lat: 37.5610, lon: 126.9860, name: '서울시 저동2가', type: '법정동', admin_parent: '명동' },
    '을지로1가': { lat: 37.5650, lon: 126.9950, name: '서울시 을지로1가', type: '법정동', admin_parent: '을지로동' },
    '을지로2가': { lat: 37.5650, lon: 126.9950, name: '서울시 을지로2가', type: '법정동', admin_parent: '을지로동' },
    '을지로3가': { lat: 37.5650, lon: 126.9950, name: '서울시 을지로3가', type: '법정동', admin_parent: '을지로동' },
    '을지로4가': { lat: 37.5650, lon: 126.9950, name: '서울시 을지로4가', type: '법정동', admin_parent: '을지로동' },
    '수하동': { lat: 37.5610, lon: 126.9860, name: '서울시 수하동', type: '법정동', admin_parent: '명동' },
    '장교동': { lat: 37.5610, lon: 126.9860, name: '서울시 장교동', type: '법정동', admin_parent: '명동' },
    '삼각동': { lat: 37.5610, lon: 126.9860, name: '서울시 삼각동', type: '법정동', admin_parent: '명동' },
    '다동': { lat: 37.5610, lon: 126.9860, name: '서울시 다동', type: '법정동', admin_parent: '명동' },
    '무교동': { lat: 37.5610, lon: 126.9860, name: '서울시 무교동', type: '법정동', admin_parent: '명동' },
    '태평로1가': { lat: 37.5610, lon: 126.9860, name: '서울시 태평로1가', type: '법정동', admin_parent: '명동' },
    '태평로2가': { lat: 37.5610, lon: 126.9860, name: '서울시 태평로2가', type: '법정동', admin_parent: '명동' },
    '세종로': { lat: 37.5610, lon: 126.9860, name: '서울시 세종로', type: '법정동', admin_parent: '명동' },
    '신문로1가': { lat: 37.5610, lon: 126.9860, name: '서울시 신문로1가', type: '법정동', admin_parent: '명동' },
    '신문로2가': { lat: 37.5610, lon: 126.9860, name: '서울시 신문로2가', type: '법정동', admin_parent: '명동' },
    '필동1가': { lat: 37.5600, lon: 126.9960, name: '서울시 필동1가', type: '법정동', admin_parent: '필동' },
    '필동2가': { lat: 37.5600, lon: 126.9960, name: '서울시 필동2가', type: '법정동', admin_parent: '필동' },
    '필동3가': { lat: 37.5600, lon: 126.9960, name: '서울시 필동3가', type: '법정동', admin_parent: '필동' },
    '남학동': { lat: 37.5600, lon: 126.9960, name: '서울시 남학동', type: '법정동', admin_parent: '필동' },
    '주자동': { lat: 37.5600, lon: 126.9960, name: '서울시 주자동', type: '법정동', admin_parent: '필동' },
    '예장동': { lat: 37.5600, lon: 126.9960, name: '서울시 예장동', type: '법정동', admin_parent: '필동' },
    '충무로3가': { lat: 37.5600, lon: 126.9960, name: '서울시 충무로3가', type: '법정동', admin_parent: '필동' },
    '충무로4가': { lat: 37.5600, lon: 126.9960, name: '서울시 충무로4가', type: '법정동', admin_parent: '필동' },
    '충무로5가': { lat: 37.5600, lon: 126.9960, name: '서울시 충무로5가', type: '법정동', admin_parent: '필동' },
    '장충동1가': { lat: 37.5570, lon: 127.0060, name: '서울시 장충동1가', type: '법정동', admin_parent: '장충동' },
    '장충동2가': { lat: 37.5570, lon: 127.0060, name: '서울시 장충동2가', type: '법정동', admin_parent: '장충동' },
    '묵정동': { lat: 37.5570, lon: 127.0060, name: '서울시 묵정동', type: '법정동', admin_parent: '장충동' },
    '광희동1가': { lat: 37.5640, lon: 127.0100, name: '서울시 광희동1가', type: '법정동', admin_parent: '광희동' },
    '광희동2가': { lat: 37.5640, lon: 127.0100, name: '서울시 광희동2가', type: '법정동', admin_parent: '광희동' },
    '쌍림동': { lat: 37.5640, lon: 127.0100, name: '서울시 쌍림동', type: '법정동', admin_parent: '광희동' },
    '을지로5가': { lat: 37.5650, lon: 126.9950, name: '서울시 을지로5가', type: '법정동', admin_parent: '을지로동' },
    '을지로6가': { lat: 37.5650, lon: 126.9950, name: '서울시 을지로6가', type: '법정동', admin_parent: '을지로동' },
    '을지로7가': { lat: 37.5650, lon: 126.9950, name: '서울시 을지로7가', type: '법정동', admin_parent: '을지로동' },
    '을지로8가': { lat: 37.5650, lon: 126.9950, name: '서울시 을지로8가', type: '법정동', admin_parent: '을지로동' },
    '을지로9가': { lat: 37.5650, lon: 126.9950, name: '서울시 을지로9가', type: '법정동', admin_parent: '을지로동' },
    '을지로10가': { lat: 37.5650, lon: 126.9950, name: '서울시 을지로10가', type: '법정동', admin_parent: '을지로동' },
    '흥인동': { lat: 37.5640, lon: 127.0190, name: '서울시 흥인동', type: '법정동', admin_parent: '신당동' },
    '황학동': { lat: 37.5640, lon: 127.0190, name: '서울시 황학동', type: '법정동', admin_parent: '신당동' },
    '인현동1가': { lat: 37.5650, lon: 126.9950, name: '서울시 인현동1가', type: '법정동', admin_parent: '을지로동' },
    '인현동2가': { lat: 37.5650, lon: 126.9950, name: '서울시 인현동2가', type: '법정동', admin_parent: '을지로동' },
    '초동': { lat: 37.5650, lon: 126.9950, name: '서울시 초동', type: '법정동', admin_parent: '을지로동' },
    '방산동': { lat: 37.5650, lon: 126.9950, name: '서울시 방산동', type: '법정동', admin_parent: '을지로동' },
    '주교동': { lat: 37.5650, lon: 126.9950, name: '서울시 주교동', type: '법정동', admin_parent: '을지로동' },
    '오장동': { lat: 37.5650, lon: 126.9950, name: '서울시 오장동', type: '법정동', admin_parent: '을지로동' },


    // ===== 용산구 (행정동 및 그에 속하는 법정동) =====
    '용산구_서울': { lat: 37.5320, lon: 126.9900, name: '서울시 용산구', type: '기초자치단체' },
    '후암동': { lat: 37.5500, lon: 126.9740, name: '서울시 용산구 후암동', type: '행정동', contains_legal_divisions: ['후암동'] },
    '용산2가동': { lat: 37.5400, lon: 126.9800, name: '서울시 용산구 용산2가동', type: '행정동', contains_legal_divisions: ['용산동2가', '용산동1가'] },
    '남영동': { lat: 37.5410, lon: 126.9720, name: '서울시 용산구 남영동', type: '행정동', contains_legal_divisions: ['남영동', '갈월동', '동자동'] },
    '원효로1동': { lat: 37.5360, lon: 126.9600, name: '서울시 용산구 원효로1동', type: '행정동', contains_legal_divisions: ['원효로1가', '원효로2가', '원효로3가', '원효로4가'] },
    '원효로2동': { lat: 37.5300, lon: 126.9650, name: '서울시 용산구 원효로2동', type: '행정동', contains_legal_divisions: ['원효로1가', '원효로2가', '원효로3가', '원효로4가'] },
    '효창동': { lat: 37.5450, lon: 126.9600, name: '서울시 용산구 효창동', type: '행정동', contains_legal_divisions: ['효창동', '용문동', '신계동', '문배동'] },
    '용문동': { lat: 37.5390, lon: 126.9550, name: '서울시 용산구 용문동', type: '행정동', contains_legal_divisions: ['용문동', '도원동', '산천동'] },
    '한강로동': { lat: 37.5300, lon: 126.9750, name: '서울시 용산구 한강로동', type: '행정동', contains_legal_divisions: ['한강로1가', '한강로2가', '한강로3가', '용산동3가', '용산동4가', '용산동5가', '신용산동', '이촌동'] },
    '이촌1동': { lat: 37.5220, lon: 126.9740, name: '서울시 용산구 이촌1동', type: '행정동', contains_legal_divisions: ['이촌동'] },
    '이촌2동': { lat: 37.5200, lon: 126.9790, name: '서울시 용산구 이촌2동', type: '행정동', contains_legal_divisions: ['이촌동'] },
    '이태원1동': { lat: 37.5350, lon: 126.9950, name: '서울시 용산구 이태원1동', type: '행정동', contains_legal_divisions: ['이태원동'] },
    '이태원2동': { lat: 37.5300, lon: 127.0000, name: '서울시 용산구 이태원2동', type: '행정동', contains_legal_divisions: ['이태원동', '보광동'] },
    '한남동': { lat: 37.5420, lon: 127.0050, name: '서울시 용산구 한남동', type: '행정동', contains_legal_divisions: ['한남동', '동빙고동', '서빙고동', '주성동', '보광동'] },
    '서빙고동': { lat: 37.5330, lon: 126.9990, name: '서울시 용산구 서빙고동', type: '행정동', contains_legal_divisions: ['서빙고동', '동빙고동'] },
    '보광동': { lat: 37.5300, lon: 127.0050, name: '서울시 용산구 보광동', type: '행정동', contains_legal_divisions: ['보광동', '주성동'] },
    '청파동': { lat: 37.5470, lon: 126.9700, name: '서울시 용산구 청파동', type: '행정동', contains_legal_divisions: ['청파동1가', '청파동2가', '청파동3가'] },
    '서계동': { lat: 37.5500, lon: 126.9690, name: '서울시 용산구 서계동', type: '행정동', contains_legal_divisions: ['서계동', '청파동1가'] },

    // 용산구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '용산동1가': { lat: 37.5400, lon: 126.9800, name: '서울시 용산동1가', type: '법정동', admin_parent: '용산2가동' },
    '용산동2가': { lat: 37.5400, lon: 126.9800, name: '서울시 용산동2가', type: '법정동', admin_parent: '용산2가동' },
    '갈월동': { lat: 37.5410, lon: 126.9720, name: '서울시 갈월동', type: '법정동', admin_parent: '남영동' },
    '동자동': { lat: 37.5410, lon: 126.9720, name: '서울시 동자동', type: '법정동', admin_parent: '남영동' },
    '원효로1가': { lat: 37.5360, lon: 126.9600, name: '서울시 원효로1가', type: '법정동', admin_parent: '원효로1동' },
    '원효로2가': { lat: 37.5360, lon: 126.9600, name: '서울시 원효로2가', type: '법정동', admin_parent: '원효로1동' },
    '원효로3가': { lat: 37.5360, lon: 126.9600, name: '서울시 원효로3가', type: '법정동', admin_parent: '원효로1동' },
    '원효로4가': { lat: 37.5360, lon: 126.9600, name: '서울시 원효로4가', type: '법정동', admin_parent: '원효로1동' },
    '용문동': { lat: 37.5390, lon: 126.9550, name: '서울시 용문동', type: '법정동', admin_parent: '용문동' },
    '신계동': { lat: 37.5450, lon: 126.9600, name: '서울시 신계동', type: '법정동', admin_parent: '효창동' },
    '문배동': { lat: 37.5450, lon: 126.9600, name: '서울시 문배동', type: '법정동', admin_parent: '효창동' },
    '도원동_용산구': { lat: 37.5390, lon: 126.9550, name: '서울시 도원동', type: '법정동', admin_parent: '용문동' },
    '산천동': { lat: 37.5390, lon: 126.9550, name: '서울시 산천동', type: '법정동', admin_parent: '용문동' },
    '한강로1가': { lat: 37.5300, lon: 126.9750, name: '서울시 한강로1가', type: '법정동', admin_parent: '한강로동' },
    '한강로2가': { lat: 37.5300, lon: 126.9750, name: '서울시 한강로2가', type: '법정동', admin_parent: '한강로동' },
    '한강로3가': { lat: 37.5300, lon: 126.9750, name: '서울시 한강로3가', type: '법정동', admin_parent: '한강로동' },
    '용산동3가': { lat: 37.5300, lon: 126.9750, name: '서울시 용산동3가', type: '법정동', admin_parent: '한강로동' },
    '용산동4가': { lat: 37.5300, lon: 126.9750, name: '서울시 용산동4가', type: '법정동', admin_parent: '한강로동' },
    '용산동5가': { lat: 37.5300, lon: 126.9750, name: '서울시 용산동5가', type: '법정동', admin_parent: '한강로동' },
    '신용산동': { lat: 37.5300, lon: 126.9750, name: '서울시 신용산동', type: '법정동', admin_parent: '한강로동' },
    '이촌동': { lat: 37.5220, lon: 126.9740, name: '서울시 이촌동', type: '법정동', admin_parent: '이촌1동' },
    '동빙고동': { lat: 37.5330, lon: 126.9990, name: '서울시 동빙고동', type: '법정동', admin_parent: '서빙고동' },
    '서빙고동_용산구': { lat: 37.5330, lon: 126.9990, name: '서울시 서빙고동', type: '법정동', admin_parent: '서빙고동' },
    '주성동': { lat: 37.5420, lon: 127.0050, name: '서울시 주성동', type: '법정동', admin_parent: '한남동' },
    '보광동_용산구': { lat: 37.5300, lon: 127.0050, name: '서울시 보광동', type: '법정동', admin_parent: '보광동' },
    '청파동1가': { lat: 37.5470, lon: 126.9700, name: '서울시 청파동1가', type: '법정동', admin_parent: '청파동' },
    '청파동2가': { lat: 37.5470, lon: 126.9700, name: '서울시 청파동2가', type: '법정동', admin_parent: '청파동' },
    '청파동3가': { lat: 37.5470, lon: 126.9700, name: '서울시 청파동3가', type: '법정동', admin_parent: '청파동' },
    '서계동': { lat: 37.5500, lon: 126.9690, name: '서울시 서계동', type: '법정동', admin_parent: '서계동' },


    // ===== 성동구 (행정동 및 그에 속하는 법정동) =====
    '성동구_서울': { lat: 37.5630, lon: 127.0360, name: '서울시 성동구', type: '기초자치단체' },
    '왕십리2동': { lat: 37.5680, lon: 127.0300, name: '서울시 성동구 왕십리2동', type: '행정동', contains_legal_divisions: ['왕십리2동'] },
    '왕십리도선동': { lat: 37.5620, lon: 127.0270, name: '서울시 성동구 왕십리도선동', type: '행정동', contains_legal_divisions: ['왕십리동', '도선동', '홍익동'] },
    '마장동': { lat: 37.5700, lon: 127.0400, name: '서울시 성동구 마장동', type: '행정동', contains_legal_divisions: ['마장동'] },
    '사근동': { lat: 37.5560, lon: 127.0420, name: '서울시 성동구 사근동', type: '행정동', contains_legal_divisions: ['사근동', '행당동'] },
    '행당1동': { lat: 37.5590, lon: 127.0330, name: '서울시 성동구 행당1동', type: '행정동', contains_legal_divisions: ['행당동'] },
    '행당2동': { lat: 37.5550, lon: 127.0380, name: '서울시 성동구 행당2동', type: '행정동', contains_legal_divisions: ['행당동'] },
    '응봉동': { lat: 37.5450, lon: 127.0380, name: '서울시 성동구 응봉동', type: '행정동', contains_legal_divisions: ['응봉동'] },
    '금호1가동': { lat: 37.5520, lon: 127.0180, name: '서울시 성동구 금호1가동', type: '행정동', contains_legal_divisions: ['금호동1가'] },
    '금호2.3가동': { lat: 37.5500, lon: 127.0250, name: '서울시 성동구 금호2.3가동', type: '행정동', contains_legal_divisions: ['금호동2가', '금호동3가'] },
    '금호4가동': { lat: 37.5470, lon: 127.0300, name: '서울시 성동구 금호4가동', type: '행정동', contains_legal_divisions: ['금호동4가'] },
    '옥수동': { lat: 37.5400, lon: 127.0100, name: '서울시 성동구 옥수동', type: '행정동', contains_legal_divisions: ['옥수동', '응봉동'] },
    '성수1가1동': { lat: 37.5450, lon: 127.0500, name: '서울시 성동구 성수1가1동', type: '행정동', contains_legal_divisions: ['성수동1가'] },
    '성수1가2동': { lat: 37.5470, lon: 127.0550, name: '서울시 성동구 성수1가2동', type: '행정동', contains_legal_divisions: ['성수동1가'] },
    '성수2가1동': { lat: 37.5400, lon: 127.0600, name: '서울시 성동구 성수2가1동', type: '행정동', contains_legal_divisions: ['성수동2가'] },
    '성수2가3동': { lat: 37.5350, lon: 127.0650, name: '서울시 성동구 성수2가3동', type: '행정동', contains_legal_divisions: ['성수동2가'] },
    '송정동': { lat: 37.5470, lon: 127.0700, name: '서울시 성동구 송정동', type: '행정동', contains_legal_divisions: ['송정동'] },
    '용답동': { lat: 37.5620, lon: 127.0600, name: '서울시 성동구 용답동', type: '행정동', contains_legal_divisions: ['용답동', '마장동'] },

    // 성동구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '왕십리동': { lat: 37.5620, lon: 127.0270, name: '서울시 왕십리동', type: '법정동', admin_parent: '왕십리도선동' },
    '도선동': { lat: 37.5620, lon: 127.0270, name: '서울시 도선동', type: '법정동', admin_parent: '왕십리도선동' },
    '홍익동': { lat: 37.5620, lon: 127.0270, name: '서울시 홍익동', type: '법정동', admin_parent: '왕십리도선동' },
    '행당동': { lat: 37.5590, lon: 127.0330, name: '서울시 행당동', type: '법정동', admin_parent: '행당1동' },
    '금호동1가': { lat: 37.5520, lon: 127.0180, name: '서울시 금호동1가', type: '법정동', admin_parent: '금호1가동' },
    '금호동2가': { lat: 37.5500, lon: 127.0250, name: '서울시 금호동2가', type: '법정동', admin_parent: '금호2.3가동' },
    '금호동3가': { lat: 37.5500, lon: 127.0250, name: '서울시 금호동3가', type: '법정동', admin_parent: '금호2.3가동' },
    '금호동4가': { lat: 37.5470, lon: 127.0300, name: '서울시 금호동4가', type: '법정동', admin_parent: '금호4가동' },
    '옥수동': { lat: 37.5400, lon: 127.0100, name: '서울시 옥수동', type: '법정동', admin_parent: '옥수동' },
    '성수동1가': { lat: 37.5450, lon: 127.0500, name: '서울시 성수동1가', type: '법정동', admin_parent: '성수1가1동' },
    '성수동2가': { lat: 37.5400, lon: 127.0600, name: '서울시 성수동2가', type: '법정동', admin_parent: '성수2가1동' },
    '용답동': { lat: 37.5620, lon: 127.0600, name: '서울시 용답동', type: '법정동', admin_parent: '용답동' },


    // ===== 광진구 (행정동 및 그에 속하는 법정동) =====
    '광진구_서울': { lat: 37.5380, lon: 127.0840, name: '서울시 광진구', type: '기초자치단체' },
    '중곡1동': { lat: 37.5700, lon: 127.0850, name: '서울시 광진구 중곡1동', type: '행정동', contains_legal_divisions: ['중곡동'] },
    '중곡2동': { lat: 37.5720, lon: 127.0900, name: '서울시 광진구 중곡2동', type: '행정동', contains_legal_divisions: ['중곡동'] },
    '중곡3동': { lat: 37.5740, lon: 127.0950, name: '서울시 광진구 중곡3동', type: '행정동', contains_legal_divisions: ['중곡동'] },
    '중곡4동': { lat: 37.5760, lon: 127.1000, name: '서울시 광진구 중곡4동', type: '행정동', contains_legal_divisions: ['중곡동'] },
    '능동': { lat: 37.5500, lon: 127.0700, name: '서울시 광진구 능동', type: '행정동', contains_legal_divisions: ['능동'] },
    '구의1동': { lat: 37.5350, lon: 127.0800, name: '서울시 광진구 구의1동', type: '행정동', contains_legal_divisions: ['구의동'] },
    '구의2동': { lat: 37.5300, lon: 127.0850, name: '서울시 광진구 구의2동', type: '행정동', contains_legal_divisions: ['구의동'] },
    '구의3동': { lat: 37.5250, lon: 127.0900, name: '서울시 광진구 구의3동', type: '행정동', contains_legal_divisions: ['구의동'] },
    '광장동': { lat: 37.5400, lon: 127.1000, name: '서울시 광진구 광장동', type: '행정동', contains_legal_divisions: ['광장동'] },
    '자양1동': { lat: 37.5250, lon: 127.0680, name: '서울시 광진구 자양1동', type: '행정동', contains_legal_divisions: ['자양동'] },
    '자양2동': { lat: 37.5200, lon: 127.0730, name: '서울시 광진구 자양2동', type: '행정동', contains_legal_divisions: ['자양동'] },
    '자양3동': { lat: 37.5150, lon: 127.0780, name: '서울시 광진구 자양3동', type: '행정동', contains_legal_divisions: ['자양동'] },
    '자양4동': { lat: 37.5100, lon: 127.0830, name: '서울시 광진구 자양4동', type: '행정동', contains_legal_divisions: ['자양동'] },
    '화양동': { lat: 37.5400, lon: 127.0700, name: '서울시 광진구 화양동', type: '행정동', contains_legal_divisions: ['화양동'] },
    '군자동': { lat: 37.5500, lon: 127.0780, name: '서울시 광진구 군자동', type: '행정동', contains_legal_divisions: ['군자동'] },

    // 광진구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 광진구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 동대문구 (행정동 및 그에 속하는 법정동) =====
    '동대문구_서울': { lat: 37.5744, lon: 127.0396, name: '서울시 동대문구', type: '기초자치단체' },
    '회기동': { lat: 37.5920, lon: 127.0570, name: '서울시 동대문구 회기동', type: '행정동', contains_legal_divisions: ['회기동', '청량리동', '휘경동'] },
    '청량리동': { lat: 37.5980, lon: 127.0450, name: '서울시 동대문구 청량리동', type: '행정동', contains_legal_divisions: ['청량리동', '전농동', '제기동'] },
    '용신동': { lat: 37.5760, lon: 127.0300, name: '서울시 동대문구 용신동', type: '행정동', contains_legal_divisions: ['용두동', '신설동'] },
    '제기동': { lat: 37.5850, lon: 127.0330, name: '서울시 동대문구 제기동', type: '행정동', contains_legal_divisions: ['제기동'] },
    '전농1동': { lat: 37.5800, lon: 127.0500, name: '서울시 동대문구 전농1동', type: '행정동', contains_legal_divisions: ['전농동'] },
    '전농2동': { lat: 37.5850, lon: 127.0550, name: '서울시 동대문구 전농2동', type: '행정동', contains_legal_divisions: ['전농동'] },
    '답십리1동': { lat: 37.5700, lon: 127.0500, name: '서울시 동대문구 답십리1동', type: '행정동', contains_legal_divisions: ['답십리동'] },
    '답십리2동': { lat: 37.5750, lon: 127.0550, name: '서울시 동대문구 답십리2동', type: '행정동', contains_legal_divisions: ['답십리동'] },
    '장안1동': { lat: 37.5700, lon: 127.0700, name: '서울시 동대문구 장안1동', type: '행정동', contains_legal_divisions: ['장안동'] },
    '장안2동': { lat: 37.5750, lon: 127.0750, name: '서울시 동대문구 장안2동', type: '행정동', contains_legal_divisions: ['장안동'] },
    '이문1동': { lat: 37.5950, lon: 127.0650, name: '서울시 동대문구 이문1동', type: '행정동', contains_legal_divisions: ['이문동'] },
    '이문2동': { lat: 37.6000, lon: 127.0700, name: '서울시 동대문구 이문2동', type: '행정동', contains_legal_divisions: ['이문동'] },
    '휘경1동': { lat: 37.5900, lon: 127.0550, name: '서울시 동대문구 휘경1동', type: '행정동', contains_legal_divisions: ['휘경동'] },
    '휘경2동': { lat: 37.5950, lon: 127.0600, name: '서울시 동대문구 휘경2동', type: '행정동', contains_legal_divisions: ['휘경동'] },
    '청량리동': { lat: 37.5980, lon: 127.0450, name: '서울시 동대문구 청량리동', type: '행정동', contains_legal_divisions: ['청량리동'] },

    // 동대문구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '용두동': { lat: 37.5760, lon: 127.0300, name: '서울시 용두동', type: '법정동', admin_parent: '용신동' },
    '신설동': { lat: 37.5760, lon: 127.0300, name: '서울시 신설동', type: '법정동', admin_parent: '용신동' },


    // ===== 중랑구 (행정동 및 그에 속하는 법정동) =====
    '중랑구_서울': { lat: 37.5950, lon: 127.0860, name: '서울시 중랑구', type: '기초자치단체' },
    '면목2동': { lat: 37.5850, lon: 127.0700, name: '서울시 중랑구 면목2동', type: '행정동', contains_legal_divisions: ['면목동'] },
    '면목3.8동': { lat: 37.5900, lon: 127.0750, name: '서울시 중랑구 면목3.8동', type: '행정동', contains_legal_divisions: ['면목동'] },
    '면목4동': { lat: 37.5950, lon: 127.0800, name: '서울시 중랑구 면목4동', type: '행정동', contains_legal_divisions: ['면목동'] },
    '면목5동': { lat: 37.6000, lon: 127.0850, name: '서울시 중랑구 면목5동', type: '행정동', contains_legal_divisions: ['면목동'] },
    '면목본동': { lat: 37.5800, lon: 127.0650, name: '서울시 중랑구 면목본동', type: '행정동', contains_legal_divisions: ['면목동'] },
    '상봉1동': { lat: 37.5900, lon: 127.0900, name: '서울시 중랑구 상봉1동', type: '행정동', contains_legal_divisions: ['상봉동', '중화동'] },
    '상봉2동': { lat: 37.5950, lon: 127.0950, name: '서울시 중랑구 상봉2동', type: '행정동', contains_legal_divisions: ['상봉동', '중화동'] },
    '중화1동': { lat: 37.6000, lon: 127.1000, name: '서울시 중랑구 중화1동', type: '행정동', contains_legal_divisions: ['중화동'] },
    '중화2동': { lat: 37.6050, lon: 127.1050, name: '서울시 중랑구 중화2동', type: '행정동', contains_legal_divisions: ['중화동'] },
    '묵1동': { lat: 37.6100, lon: 127.0800, name: '서울시 중랑구 묵1동', type: '행정동', contains_legal_divisions: ['묵동'] },
    '묵2동': { lat: 37.6150, lon: 127.0850, name: '서울시 중랑구 묵2동', type: '행정동', contains_legal_divisions: ['묵동'] },
    '망우3동': { lat: 37.6000, lon: 127.1100, name: '서울시 중랑구 망우3동', type: '행정동', contains_legal_divisions: ['망우동', '신내동'] },
    '신내1동': { lat: 37.6200, lon: 127.1000, name: '서울시 중랑구 신내1동', type: '행정동', contains_legal_divisions: ['신내동'] },
    '신내2동': { lat: 37.6250, lon: 127.1050, name: '서울시 중랑구 신내2동', type: '행정동', contains_legal_divisions: ['신내동'] },
    '망우본동': { lat: 37.5900, lon: 127.1000, name: '서울시 중랑구 망우본동', type: '행정동', contains_legal_divisions: ['망우동', '중화동'] },

    // 중랑구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 중랑구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 성북구 (행정동 및 그에 속하는 법정동) =====
    '성북구_서울': { lat: 37.5890, lon: 127.0160, name: '서울시 성북구', type: '기초자치단체' },
    '성북동': { lat: 37.5950, lon: 127.0050, name: '서울시 성북구 성북동', type: '행정동', contains_legal_divisions: ['성북동', '성북동1가', '삼선동1가', '동소문동1가', '하월곡동'] },
    '삼선동': { lat: 37.5890, lon: 127.0090, name: '서울시 성북구 삼선동', type: '행정동', contains_legal_divisions: ['삼선동1가', '삼선동2가', '삼선동3가', '삼선동4가', '동소문동1가', '동소문동2가', '동소문동3가', '동소문동4가', '동소문동5가', '동소문동6가', '동소문동7가'] },
    '동선동': { lat: 37.5900, lon: 127.0150, name: '서울시 성북구 동선동', type: '행정동', contains_legal_divisions: ['동선동1가', '동선동2가', '동선동3가', '동선동4가', '동선동5가', '안암동1가', '안암동2가', '안암동3가', '안암동4가'] },
    '돈암1동': { lat: 37.5950, lon: 127.0200, name: '서울시 성북구 돈암1동', type: '행정동', contains_legal_divisions: ['돈암동'] },
    '돈암2동': { lat: 37.6000, lon: 127.0250, name: '서울시 성북구 돈암2동', type: '행정동', contains_legal_divisions: ['돈암동'] },
    '안암동': { lat: 37.5870, lon: 127.0250, name: '서울시 성북구 안암동', type: '행정동', contains_legal_divisions: ['안암동1가', '안암동2가', '안암동3가', '안암동4가', '안암동5가'] },
    '보문동': { lat: 37.5820, lon: 127.0170, name: '서울시 성북구 보문동', type: '행정동', contains_legal_divisions: ['보문동1가', '보문동2가', '보문동3가', '보문동4가', '보문동5가', '보문동6가', '보문동7가'] },
    '정릉1동': { lat: 37.6080, lon: 127.0000, name: '서울시 성북구 정릉1동', type: '행정동', contains_legal_divisions: ['정릉동'] },
    '정릉2동': { lat: 37.6100, lon: 127.0050, name: '서울시 성북구 정릉2동', type: '행정동', contains_legal_divisions: ['정릉동'] },
    '정릉3동': { lat: 37.6120, lon: 127.0100, name: '서울시 성북구 정릉3동', type: '행정동', contains_legal_divisions: ['정릉동'] },
    '정릉4동': { lat: 37.6140, lon: 127.0150, name: '서울시 성북구 정릉4동', type: '행정동', contains_legal_divisions: ['정릉동'] },
    '길음1동': { lat: 37.6100, lon: 127.0250, name: '서울시 성북구 길음1동', type: '행정동', contains_legal_divisions: ['길음동'] },
    '길음2동': { lat: 37.6150, lon: 127.0300, name: '서울시 성북구 길음2동', type: '행정동', contains_legal_divisions: ['길음동'] },
    '종암동': { lat: 37.6000, lon: 127.0350, name: '서울시 성북구 종암동', type: '행정동', contains_legal_divisions: ['종암동'] },
    '하월곡동': { lat: 37.6050, lon: 127.0400, name: '서울시 성북구 하월곡동', type: '행정동', contains_legal_divisions: ['하월곡동'] },
    '상월곡동': { lat: 37.6100, lon: 127.0450, name: '서울시 성북구 상월곡동', type: '행정동', contains_legal_divisions: ['상월곡동'] },
    '장위1동': { lat: 37.6150, lon: 127.0500, name: '서울시 성북구 장위1동', type: '행정동', contains_legal_divisions: ['장위동'] },
    '장위2동': { lat: 37.6200, lon: 127.0550, name: '서울시 성북구 장위2동', type: '행정동', contains_legal_divisions: ['장위동'] },
    '장위3동': { lat: 37.6250, lon: 127.0600, name: '서울시 성북구 장위3동', type: '행정동', contains_legal_divisions: ['장위동'] },
    '석관동': { lat: 37.6150, lon: 127.0650, name: '서울시 성북구 석관동', type: '행정동', contains_legal_divisions: ['석관동'] },

    // 성북구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '성북동1가': { lat: 37.5950, lon: 127.0050, name: '서울시 성북동1가', type: '법정동', admin_parent: '성북동' },
    '삼선동1가': { lat: 37.5890, lon: 127.0090, name: '서울시 삼선동1가', type: '법정동', admin_parent: '삼선동' },
    '삼선동2가': { lat: 37.5890, lon: 127.0090, name: '서울시 삼선동2가', type: '법정동', admin_parent: '삼선동' },
    '삼선동3가': { lat: 37.5890, lon: 127.0090, name: '서울시 삼선동3가', type: '법정동', admin_parent: '삼선동' },
    '삼선동4가': { lat: 37.5890, lon: 127.0090, name: '서울시 삼선동4가', type: '법정동', admin_parent: '삼선동' },
    '동소문동1가': { lat: 37.5890, lon: 127.0090, name: '서울시 동소문동1가', type: '법정동', admin_parent: '삼선동' },
    '동소문동2가': { lat: 37.5890, lon: 127.0090, name: '서울시 동소문동2가', type: '법정동', admin_parent: '삼선동' },
    '동소문동3가': { lat: 37.5890, lon: 127.0090, name: '서울시 동소문동3가', type: '법정동', admin_parent: '삼선동' },
    '동소문동4가': { lat: 37.5890, lon: 127.0090, name: '서울시 동소문동4가', type: '법정동', admin_parent: '삼선동' },
    '동소문동5가': { lat: 37.5890, lon: 127.0090, name: '서울시 동소문동5가', type: '법정동', admin_parent: '삼선동' },
    '동소문동6가': { lat: 37.5890, lon: 127.0090, name: '서울시 동소문동6가', type: '법정동', admin_parent: '삼선동' },
    '동소문동7가': { lat: 37.5890, lon: 127.0090, name: '서울시 동소문동7가', type: '법정동', admin_parent: '삼선동' },
    '동선동1가': { lat: 37.5900, lon: 127.0150, name: '서울시 동선동1가', type: '법정동', admin_parent: '동선동' },
    '동선동2가': { lat: 37.5900, lon: 127.0150, name: '서울시 동선동2가', type: '법정동', admin_parent: '동선동' },
    '동선동3가': { lat: 37.5900, lon: 127.0150, name: '서울시 동선동3가', type: '법정동', admin_parent: '동선동' },
    '동선동4가': { lat: 37.5900, lon: 127.0150, name: '서울시 동선동4가', type: '법정동', admin_parent: '동선동' },
    '동선동5가': { lat: 37.5900, lon: 127.0150, name: '서울시 동선동5가', type: '법정동', admin_parent: '동선동' },
    '안암동1가': { lat: 37.5870, lon: 127.0250, name: '서울시 안암동1가', type: '법정동', admin_parent: '안암동' },
    '안암동2가': { lat: 37.5870, lon: 127.0250, name: '서울시 안암동2가', type: '법정동', admin_parent: '안암동' },
    '안암동3가': { lat: 37.5870, lon: 127.0250, name: '서울시 안암동3가', type: '법정동', admin_parent: '안암동' },
    '안암동4가': { lat: 37.5870, lon: 127.0250, name: '서울시 안암동4가', type: '법정동', admin_parent: '안암동' },
    '안암동5가': { lat: 37.5870, lon: 127.0250, name: '서울시 안암동5가', type: '법정동', admin_parent: '안암동' },
    '보문동1가': { lat: 37.5820, lon: 127.0170, name: '서울시 보문동1가', type: '법정동', admin_parent: '보문동' },
    '보문동2가': { lat: 37.5820, lon: 127.0170, name: '서울시 보문동2가', type: '법정동', admin_parent: '보문동' },
    '보문동3가': { lat: 37.5820, lon: 127.0170, name: '서울시 보문동3가', type: '법정동', admin_parent: '보문동' },
    '보문동4가': { lat: 37.5820, lon: 127.0170, name: '서울시 보문동4가', type: '법정동', admin_parent: '보문동' },
    '보문동5가': { lat: 37.5820, lon: 127.0170, name: '서울시 보문동5가', type: '법정동', admin_parent: '보문동' },
    '보문동6가': { lat: 37.5820, lon: 127.0170, name: '서울시 보문동6가', type: '법정동', admin_parent: '보문동' },
    '보문동7가': { lat: 37.5820, lon: 127.0170, name: '서울시 보문동7가', type: '법정동', admin_parent: '보문동' },
    '하월곡동_성북구': { lat: 37.6050, lon: 127.0400, name: '서울시 하월곡동', type: '법정동', admin_parent: '하월곡동' },
    '상월곡동': { lat: 37.6100, lon: 127.0450, name: '서울시 상월곡동', type: '법정동', admin_parent: '상월곡동' },


    // ===== 강북구 (행정동 및 그에 속하는 법정동) =====
    '강북구_서울': { lat: 37.6397, lon: 127.0250, name: '서울시 강북구', type: '기초자치단체' },
    '미아동': { lat: 37.6100, lon: 127.0300, name: '서울시 강북구 미아동', type: '행정동', contains_legal_divisions: ['미아동'] }, // 여러 미아동이 미아동 법정동을 포함
    '미아동_강북구': { lat: 37.6100, lon: 127.0300, name: '서울시 미아동', type: '법정동', admin_parent: '미아동' }, // 법정동 미아동 자체는 여러 행정동에 걸쳐있음

    '미아동1동': { lat: 37.6150, lon: 127.0350, name: '서울시 강북구 미아1동', type: '행정동', contains_legal_divisions: ['미아동'] },
    '미아동2동': { lat: 37.6200, lon: 127.0400, name: '서울시 강북구 미아2동', type: '행정동', contains_legal_divisions: ['미아동'] },
    '미아동3동': { lat: 37.6250, lon: 127.0450, name: '서울시 강북구 미아3동', type: '행정동', contains_legal_divisions: ['미아동'] },
    '송중동': { lat: 37.6200, lon: 127.0200, name: '서울시 강북구 송중동', type: '행정동', contains_legal_divisions: ['미아동'] },
    '송천동': { lat: 37.6250, lon: 127.0250, name: '서울시 강북구 송천동', type: '행정동', contains_legal_divisions: ['미아동'] },
    '삼각산동': { lat: 37.6300, lon: 127.0300, name: '서울시 강북구 삼각산동', type: '행정동', contains_legal_divisions: ['미아동'] },
    '번1동': { lat: 37.6200, lon: 127.0100, name: '서울시 강북구 번1동', type: '행정동', contains_legal_divisions: ['번동'] },
    '번2동': { lat: 37.6250, lon: 127.0150, name: '서울시 강북구 번2동', type: '행정동', contains_legal_divisions: ['번동'] },
    '번3동': { lat: 37.6300, lon: 127.0200, name: '서울시 강북구 번3동', type: '행정동', contains_legal_divisions: ['번동'] },
    '수유1동': { lat: 37.6350, lon: 127.0000, name: '서울시 강북구 수유1동', type: '행정동', contains_legal_divisions: ['수유동'] },
    '수유2동': { lat: 37.6400, lon: 127.0050, name: '서울시 강북구 수유2동', type: '행정동', contains_legal_divisions: ['수유동'] },
    '수유3동': { lat: 37.6450, lon: 127.0100, name: '서울시 강북구 수유3동', type: '행정동', contains_legal_divisions: ['수유동'] },
    '인수동': { lat: 37.6500, lon: 127.0150, name: '서울시 강북구 인수동', type: '행정동', contains_legal_divisions: ['수유동', '우이동'] },
    '우이동': { lat: 37.6600, lon: 127.0000, name: '서울시 강북구 우이동', type: '행정동', contains_legal_divisions: ['우이동'] },

    // 강북구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 강북구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다. (미아동은 이미 위에서 선언됨)


    // ===== 도봉구 (행정동 및 그에 속하는 법정동) =====
    '도봉구_서울': { lat: 37.6688, lon: 127.0471, name: '서울시 도봉구', type: '기초자치단체' },
    '쌍문1동': { lat: 37.6480, lon: 127.0300, name: '서울시 도봉구 쌍문1동', type: '행정동', contains_legal_divisions: ['쌍문동'] },
    '쌍문2동': { lat: 37.6500, lon: 127.0350, name: '서울시 도봉구 쌍문2동', type: '행정동', contains_legal_divisions: ['쌍문동'] },
    '쌍문3동': { lat: 37.6520, lon: 127.0400, name: '서울시 도봉구 쌍문3동', type: '행정동', contains_legal_divisions: ['쌍문동'] },
    '쌍문4동': { lat: 37.6540, lon: 127.0450, name: '서울시 도봉구 쌍문4동', type: '행정동', contains_legal_divisions: ['쌍문동'] },
    '방학1동': { lat: 37.6600, lon: 127.0200, name: '서울시 도봉구 방학1동', type: '행정동', contains_legal_divisions: ['방학동'] },
    '방학2동': { lat: 37.6620, lon: 127.0250, name: '서울시 도봉구 방학2동', type: '행정동', contains_legal_divisions: ['방학동'] },
    '방학3동': { lat: 37.6640, lon: 127.0300, name: '서울시 도봉구 방학3동', type: '행정동', contains_legal_divisions: ['방학동'] },
    '창1동': { lat: 37.6500, lon: 127.0500, name: '서울시 도봉구 창1동', type: '행정동', contains_legal_divisions: ['창동'] },
    '창2동': { lat: 37.6520, lon: 127.0550, name: '서울시 도봉구 창2동', type: '행정동', contains_legal_divisions: ['창동'] },
    '창3동': { lat: 37.6540, lon: 127.0600, name: '서울시 도봉구 창3동', type: '행정동', contains_legal_divisions: ['창동'] },
    '창4동': { lat: 37.6560, lon: 127.0650, name: '서울시 도봉구 창4동', type: '행정동', contains_legal_divisions: ['창동'] },
    '창5동': { lat: 37.6580, lon: 127.0700, name: '서울시 도봉구 창5동', type: '행정동', contains_legal_divisions: ['창동'] },
    '도봉1동': { lat: 37.6700, lon: 127.0300, name: '서울시 도봉구 도봉1동', type: '행정동', contains_legal_divisions: ['도봉동'] },
    '도봉2동': { lat: 37.6720, lon: 127.0350, name: '서울시 도봉구 도봉2동', type: '행정동', contains_legal_divisions: ['도봉동'] },

    // 도봉구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 도봉구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 노원구 (행정동 및 그에 속하는 법정동) =====
    '노원구_서울': { lat: 37.6542, lon: 127.0569, name: '서울시 노원구', type: '기초자치단체' },
    '월계1동': { lat: 37.6250, lon: 127.0500, name: '서울시 노원구 월계1동', type: '행정동', contains_legal_divisions: ['월계동'] },
    '월계2동': { lat: 37.6270, lon: 127.0550, name: '서울시 노원구 월계2동', type: '행정동', contains_legal_divisions: ['월계동'] },
    '월계3동': { lat: 37.6290, lon: 127.0600, name: '서울시 노원구 월계3동', type: '행정동', contains_legal_divisions: ['월계동'] },
    '공릉1동': { lat: 37.6200, lon: 127.0700, name: '서울시 노원구 공릉1동', type: '행정동', contains_legal_divisions: ['공릉동'] },
    '공릉2동': { lat: 37.6250, lon: 127.0750, name: '서울시 노원구 공릉2동', type: '행정동', contains_legal_divisions: ['공릉동'] },
    '하계1동': { lat: 37.6400, lon: 127.0700, name: '서울시 노원구 하계1동', type: '행정동', contains_legal_divisions: ['하계동'] },
    '하계2동': { lat: 37.6420, lon: 127.0750, name: '서울시 노원구 하계2동', type: '행정동', contains_legal_divisions: ['하계동'] },
    '중계본동': { lat: 37.6450, lon: 127.0600, name: '서울시 노원구 중계본동', type: '행정동', contains_legal_divisions: ['중계동'] },
    '중계1동': { lat: 37.6470, lon: 127.0650, name: '서울시 노원구 중계1동', type: '행정동', contains_legal_divisions: ['중계동'] },
    '중계2.3동': { lat: 37.6490, lon: 127.0700, name: '서울시 노원구 중계2.3동', type: '행정동', contains_legal_divisions: ['중계동'] },
    '상계1동': { lat: 37.6650, lon: 127.0500, name: '서울시 노원구 상계1동', type: '행정동', contains_legal_divisions: ['상계동'] },
    '상계2동': { lat: 37.6670, lon: 127.0550, name: '서울시 노원구 상계2동', type: '행정동', contains_legal_divisions: ['상계동'] },
    '상계3.4동': { lat: 37.6690, lon: 127.0600, name: '서울시 노원구 상계3.4동', type: '행정동', contains_legal_divisions: ['상계동'] },
    '상계5동': { lat: 37.6710, lon: 127.0650, name: '서울시 노원구 상계5동', type: '행정동', contains_legal_divisions: ['상계동'] },
    '상계6.7동': { lat: 37.6730, lon: 127.0700, name: '서울시 노원구 상계6.7동', type: '행정동', contains_legal_divisions: ['상계동'] },
    '상계8동': { lat: 37.6750, lon: 127.0750, name: '서울시 노원구 상계8동', type: '행정동', contains_legal_divisions: ['상계동'] },
    '상계9동': { lat: 37.6770, lon: 127.0800, name: '서울시 노원구 상계9동', type: '행정동', contains_legal_divisions: ['상계동'] },
    '상계10동': { lat: 37.6790, lon: 127.0850, name: '서울시 노원구 상계10동', type: '행정동', contains_legal_divisions: ['상계동'] },
    '상계11동': { lat: 37.6810, lon: 127.0900, name: '서울시 노원구 상계11동', type: '행정동', contains_legal_divisions: ['상계동'] },

    // 노원구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 노원구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 은평구 (행정동 및 그에 속하는 법정동) =====
    '은평구_서울': { lat: 37.6176, lon: 126.9227, name: '서울시 은평구', type: '기초자치단체' },
    '녹번동': { lat: 37.6070, lon: 126.9320, name: '서울시 은평구 녹번동', type: '행정동', contains_legal_divisions: ['녹번동'] },
    '불광1동': { lat: 37.6150, lon: 126.9200, name: '서울시 은평구 불광1동', type: '행정동', contains_legal_divisions: ['불광동'] },
    '불광2동': { lat: 37.6180, lon: 126.9250, name: '서울시 은평구 불광2동', type: '행정동', contains_legal_divisions: ['불광동'] },
    '갈현1동': { lat: 37.6250, lon: 126.9100, name: '서울시 은평구 갈현1동', type: '행정동', contains_legal_divisions: ['갈현동'] },
    '갈현2동': { lat: 37.6280, lon: 126.9150, name: '서울시 은평구 갈현2동', type: '행정동', contains_legal_divisions: ['갈현동'] },
    '구산동': { lat: 37.6100, lon: 126.9050, name: '서울시 은평구 구산동', type: '행정동', contains_legal_divisions: ['구산동'] },
    '대조동': { lat: 37.6180, lon: 126.9100, name: '서울시 은평구 대조동', type: '행정동', contains_legal_divisions: ['대조동'] },
    '응암1동': { lat: 37.5950, lon: 126.9300, name: '서울시 은평구 응암1동', type: '행정동', contains_legal_divisions: ['응암동'] },
    '응암2동': { lat: 37.5980, lon: 126.9350, name: '서울시 은평구 응암2동', type: '행정동', contains_legal_divisions: ['응암동'] },
    '응암3동': { lat: 37.6010, lon: 126.9400, name: '서울시 은평구 응암3동', type: '행정동', contains_legal_divisions: ['응암동'] },
    '역촌동': { lat: 37.6050, lon: 126.9150, name: '서울시 은평구 역촌동', type: '행정동', contains_legal_divisions: ['역촌동'] },
    '신사1동': { lat: 37.6100, lon: 126.9000, name: '서울시 은평구 신사1동', type: '행정동', contains_legal_divisions: ['신사동'] },
    '신사2동': { lat: 37.6130, lon: 126.9050, name: '서울시 은평구 신사2동', type: '행정동', contains_legal_divisions: ['신사동'] },
    '증산동': { lat: 37.5850, lon: 126.9150, name: '서울시 은평구 증산동', type: '행정동', contains_legal_divisions: ['증산동'] },
    '수색동': { lat: 37.5800, lon: 126.8950, name: '서울시 은평구 수색동', type: '행정동', contains_legal_divisions: ['수색동', '증산동'] },
    '진관동': { lat: 37.6350, lon: 126.9200, name: '서울시 은평구 진관동', type: '행정동', contains_legal_divisions: ['진관동', '구파발동'] },

    // 은평구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '구파발동': { lat: 37.6350, lon: 126.9200, name: '서울시 구파발동', type: '법정동', admin_parent: '진관동' },


    // ===== 서대문구 (행정동 및 그에 속하는 법정동) =====
    '서대문구_서울': { lat: 37.5794, lon: 126.9360, name: '서울시 서대문구', type: '기초자치단체' },
    '천연동': { lat: 37.5700, lon: 126.9500, name: '서울시 서대문구 천연동', type: '행정동', contains_legal_divisions: ['천연동', '옥천동', '영천동', '현저동'] },
    '홍제1동': { lat: 37.5880, lon: 126.9400, name: '서울시 서대문구 홍제1동', type: '행정동', contains_legal_divisions: ['홍제동'] },
    '홍제2동': { lat: 37.5900, lon: 126.9450, name: '서울시 서대문구 홍제2동', type: '행정동', contains_legal_divisions: ['홍제동'] },
    '홍제3동': { lat: 37.5920, lon: 126.9500, name: '서울시 서대문구 홍제3동', type: '행정동', contains_legal_divisions: ['홍제동'] },
    '홍은1동': { lat: 37.5950, lon: 126.9350, name: '서울시 서대문구 홍은1동', type: '행정동', contains_legal_divisions: ['홍은동'] },
    '홍은2동': { lat: 37.5980, lon: 126.9400, name: '서울시 서대문구 홍은2동', type: '행정동', contains_legal_divisions: ['홍은동'] },
    '남가좌1동': { lat: 37.5750, lon: 126.9150, name: '서울시 서대문구 남가좌1동', type: '행정동', contains_legal_divisions: ['남가좌동'] },
    '남가좌2동': { lat: 37.5780, lon: 126.9200, name: '서울시 서대문구 남가좌2동', type: '행정동', contains_legal_divisions: ['남가좌동'] },
    '북가좌1동': { lat: 37.5800, lon: 126.9250, name: '서울시 서대문구 북가좌1동', type: '행정동', contains_legal_divisions: ['북가좌동'] },
    '북가좌2동': { lat: 37.5830, lon: 126.9300, name: '서울시 서대문구 북가좌2동', type: '행정동', contains_legal_divisions: ['북가좌동'] },
    '충현동': { lat: 37.5600, lon: 126.9550, name: '서울시 서대문구 충현동', type: '행정동', contains_legal_divisions: ['충정로2가', '충정로3가', '북아현동', '미근동'] },
    '신촌동': { lat: 37.5580, lon: 126.9370, name: '서울시 서대문구 신촌동', type: '행정동', contains_legal_divisions: ['신촌동', '창천동', '대현동', '연희동'] },
    '연희동': { lat: 37.5680, lon: 126.9300, name: '서울시 서대문구 연희동', type: '행정동', contains_legal_divisions: ['연희동', '대현동'] },
    '북아현동': { lat: 37.5620, lon: 126.9500, name: '서울시 서대문구 북아현동', type: '행정동', contains_legal_divisions: ['북아현동'] },
    '충현동_서대문구': { lat: 37.5600, lon: 126.9550, name: '서울시 서대문구 충현동', type: '행정동', contains_legal_divisions: ['충정로2가', '충정로3가', '북아현동', '미근동'] }, // 이미 위에서 정의되었지만, 행정동으로서의 충현동
    '합동': { lat: 37.5560, lon: 126.9630, name: '서울시 서대문구 합동', type: '행정동', contains_legal_divisions: ['합동', '냉천동', '미근동'] },

    // 서대문구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '옥천동': { lat: 37.5700, lon: 126.9500, name: '서울시 옥천동', type: '법정동', admin_parent: '천연동' },
    '영천동': { lat: 37.5700, lon: 126.9500, name: '서울시 영천동', type: '법정동', admin_parent: '천연동' },
    '현저동': { lat: 37.5700, lon: 126.9500, name: '서울시 현저동', type: '법정동', admin_parent: '천연동' },
    '충정로2가': { lat: 37.5600, lon: 126.9550, name: '서울시 충정로2가', type: '법정동', admin_parent: '충현동' },
    '충정로3가': { lat: 37.5600, lon: 126.9550, name: '서울시 충정로3가', type: '법정동', admin_parent: '충현동' },
    '미근동': { lat: 37.5600, lon: 126.9550, name: '서울시 미근동', type: '법정동', admin_parent: '충현동' },
    '창천동': { lat: 37.5580, lon: 126.9370, name: '서울시 창천동', type: '법정동', admin_parent: '신촌동' },
    '대현동_서대문구': { lat: 37.5580, lon: 126.9370, name: '서울시 대현동', type: '법정동', admin_parent: '신촌동' },
    '연희동_서대문구': { lat: 37.5680, lon: 126.9300, name: '서울시 연희동', type: '법정동', admin_parent: '연희동_서대문구' },
    '합동': { lat: 37.5560, lon: 126.9630, name: '서울시 합동', type: '법정동', admin_parent: '합동' },
    '냉천동_서대문구': { lat: 37.5560, lon: 126.9630, name: '서울시 냉천동', type: '법정동', admin_parent: '합동' },


    // ===== 마포구 (행정동 및 그에 속하는 법정동) =====
    '마포구_서울': { lat: 37.5600, lon: 126.9080, name: '서울시 마포구', type: '기초자치단체' },
    '아현동': { lat: 37.5560, lon: 126.9450, name: '서울시 마포구 아현동', type: '행정동', contains_legal_divisions: ['아현동'] },
    '공덕동': { lat: 37.5450, lon: 126.9530, name: '서울시 마포구 공덕동', type: '행정동', contains_legal_divisions: ['공덕동', '신공덕동'] },
    '도화동': { lat: 37.5400, lon: 126.9480, name: '서울시 마포구 도화동', type: '행정동', contains_legal_divisions: ['도화동'] },
    '용강동': { lat: 37.5350, lon: 126.9400, name: '서울시 마포구 용강동', type: '행정동', contains_legal_divisions: ['용강동', '토정동', '하중동', '신정동', '현석동'] },
    '대흥동': { lat: 37.5520, lon: 126.9400, name: '서울시 마포구 대흥동', type: '행정동', contains_legal_divisions: ['대흥동', '염리동'] },
    '염리동': { lat: 37.5500, lon: 126.9350, name: '서울시 마포구 염리동', type: '행정동', contains_legal_divisions: ['염리동', '신수동'] },
    '신수동': { lat: 37.5400, lon: 126.9300, name: '서울시 마포구 신수동', type: '행정동', contains_legal_divisions: ['신수동', '구수동', '현석동'] },
    '서강동': { lat: 37.5450, lon: 126.9250, name: '서울시 마포구 서강동', type: '행정동', contains_legal_divisions: ['신정동', '구수동', '창전동', '상수동', '하중동', '신수동'] },
    '합정동': { lat: 37.5480, lon: 126.9100, name: '서울시 마포구 합정동', type: '행정동', contains_legal_divisions: ['합정동'] },
    '망원1동': { lat: 37.5600, lon: 126.9050, name: '서울시 마포구 망원1동', type: '행정동', contains_legal_divisions: ['망원동'] },
    '망원2동': { lat: 37.5650, lon: 126.9000, name: '서울시 마포구 망원2동', type: '행정동', contains_legal_divisions: ['망원동'] },
    '연남동': { lat: 37.5670, lon: 126.9200, name: '서울시 마포구 연남동', type: '행정동', contains_legal_divisions: ['연남동'] },
    '성산1동': { lat: 37.5680, lon: 126.8950, name: '서울시 마포구 성산1동', type: '행정동', contains_legal_divisions: ['성산동'] },
    '성산2동': { lat: 37.5700, lon: 126.8900, name: '서울시 마포구 성산2동', type: '행정동', contains_legal_divisions: ['성산동'] },
    '상암동': { lat: 37.5780, lon: 126.8850, name: '서울시 마포구 상암동', type: '행정동', contains_legal_divisions: ['상암동'] },

    // 마포구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '신공덕동': { lat: 37.5450, lon: 126.9530, name: '서울시 신공덕동', type: '법정동', admin_parent: '공덕동' },
    '토정동': { lat: 37.5350, lon: 126.9400, name: '서울시 토정동', type: '법정동', admin_parent: '용강동' },
    '하중동': { lat: 37.5350, lon: 126.9400, name: '서울시 하중동', type: '법정동', admin_parent: '용강동' },
    '신정동_마포구': { lat: 37.5350, lon: 126.9400, name: '서울시 신정동', type: '법정동', admin_parent: '용강동' },
    '현석동': { lat: 37.5350, lon: 126.9400, name: '서울시 현석동', type: '법정동', admin_parent: '용강동' },
    '구수동': { lat: 37.5400, lon: 126.9300, name: '서울시 구수동', type: '법정동', admin_parent: '신수동' },
    '창전동': { lat: 37.5450, lon: 126.9250, name: '서울시 창전동', type: '법정동', admin_parent: '서강동' },
    '상수동': { lat: 37.5450, lon: 126.9250, name: '서울시 상수동', type: '법정동', admin_parent: '서강동' },


    // ===== 양천구 (행정동 및 그에 속하는 법정동) =====
    '양천구_서울': { lat: 37.5250, lon: 126.8650, name: '서울시 양천구', type: '기초자치단체' },
    '목1동': { lat: 37.5350, lon: 126.8750, name: '서울시 양천구 목1동', type: '행정동', contains_legal_divisions: ['목동'] },
    '목2동': { lat: 37.5300, lon: 126.8800, name: '서울시 양천구 목2동', type: '행정동', contains_legal_divisions: ['목동'] },
    '목3동': { lat: 37.5250, lon: 126.8850, name: '서울시 양천구 목3동', type: '행정동', contains_legal_divisions: ['목동'] },
    '목4동': { lat: 37.5200, lon: 126.8900, name: '서울시 양천구 목4동', type: '행정동', contains_legal_divisions: ['목동'] },
    '목5동': { lat: 37.5150, lon: 126.8950, name: '서울시 양천구 목5동', type: '행정동', contains_legal_divisions: ['목동'] },
    '신월1동': { lat: 37.5300, lon: 126.8400, name: '서울시 양천구 신월1동', type: '행정동', contains_legal_divisions: ['신월동'] },
    '신월2동': { lat: 37.5320, lon: 126.8450, name: '서울시 양천구 신월2동', type: '행정동', contains_legal_divisions: ['신월동'] },
    '신월3동': { lat: 37.5340, lon: 126.8500, name: '서울시 양천구 신월3동', type: '행정동', contains_legal_divisions: ['신월동'] },
    '신월4동': { lat: 37.5360, lon: 126.8550, name: '서울시 양천구 신월4동', type: '행정동', contains_legal_divisions: ['신월동'] },
    '신월5동': { lat: 37.5380, lon: 126.8600, name: '서울시 양천구 신월5동', type: '행정동', contains_legal_divisions: ['신월동'] },
    '신월6동': { lat: 37.5400, lon: 126.8650, name: '서울시 양천구 신월6동', type: '행정동', contains_legal_divisions: ['신월동'] },
    '신월7동': { lat: 37.5420, lon: 126.8700, name: '서울시 양천구 신월7동', type: '행정동', contains_legal_divisions: ['신월동'] },
    '신정1동': { lat: 37.5250, lon: 126.8600, name: '서울시 양천구 신정1동', type: '행정동', contains_legal_divisions: ['신정동'] },
    '신정2동': { lat: 37.5200, lon: 126.8650, name: '서울시 양천구 신정2동', type: '행정동', contains_legal_divisions: ['신정동'] },
    '신정3동': { lat: 37.5150, lon: 126.8700, name: '서울시 양천구 신정3동', type: '행정동', contains_legal_divisions: ['신정동'] },
    '신정4동': { lat: 37.5100, lon: 126.8750, name: '서울시 양천구 신정4동', type: '행정동', contains_legal_divisions: ['신정동'] },
    '신정6동': { lat: 37.5050, lon: 126.8800, name: '서울시 양천구 신정6동', type: '행정동', contains_legal_divisions: ['신정동'] },
    '신정7동': { lat: 37.5000, lon: 126.8850, name: '서울시 양천구 신정7동', type: '행정동', contains_legal_divisions: ['신정동'] },

    // 양천구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 양천구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 강서구 (행정동 및 그에 속하는 법정동) =====
    '강서구_서울': { lat: 37.5500, lon: 126.8200, name: '서울시 강서구', type: '기초자치단체' },
    '염창동': { lat: 37.5600, lon: 126.8700, name: '서울시 강서구 염창동', type: '행정동', contains_legal_divisions: ['염창동'] },
    '등촌1동': { lat: 37.5600, lon: 126.8600, name: '서울시 강서구 등촌1동', type: '행정동', contains_legal_divisions: ['등촌동'] },
    '등촌2동': { lat: 37.5550, lon: 126.8550, name: '서울시 강서구 등촌2동', type: '행정동', contains_legal_divisions: ['등촌동'] },
    '등촌3동': { lat: 37.5500, lon: 126.8500, name: '서울시 강서구 등촌3동', type: '행정동', contains_legal_divisions: ['등촌동'] },
    '화곡본동': { lat: 37.5450, lon: 126.8400, name: '서울시 강서구 화곡본동', type: '행정동', contains_legal_divisions: ['화곡동'] },
    '화곡1동': { lat: 37.5400, lon: 126.8350, name: '서울시 강서구 화곡1동', type: '행정동', contains_legal_divisions: ['화곡동'] },
    '화곡2동': { lat: 37.5350, lon: 126.8300, name: '서울시 강서구 화곡2동', type: '행정동', contains_legal_divisions: ['화곡동'] },
    '화곡3동': { lat: 37.5300, lon: 126.8250, name: '서울시 강서구 화곡3동', type: '행정동', contains_legal_divisions: ['화곡동'] },
    '화곡4동': { lat: 37.5250, lon: 126.8200, name: '서울시 강서구 화곡4동', type: '행정동', contains_legal_divisions: ['화곡동'] },
    '화곡6동': { lat: 37.5200, lon: 126.8150, name: '서울시 강서구 화곡6동', type: '행정동', contains_legal_divisions: ['화곡동'] },
    '화곡8동': { lat: 37.5150, lon: 126.8100, name: '서울시 강서구 화곡8동', type: '행정동', contains_legal_divisions: ['화곡동'] },
    '가양1동': { lat: 37.5650, lon: 126.8400, name: '서울시 강서구 가양1동', type: '행정동', contains_legal_divisions: ['가양동'] },
    '가양2동': { lat: 37.5700, lon: 126.8350, name: '서울시 강서구 가양2동', type: '행정동', contains_legal_divisions: ['가양동'] },
    '가양3동': { lat: 37.5750, lon: 126.8300, name: '서울시 강서구 가양3동', type: '행정동', contains_legal_divisions: ['가양동'] },
    '발산1동': { lat: 37.5600, lon: 126.8200, name: '서울시 강서구 발산1동', type: '행정동', contains_legal_divisions: ['발산동', '내발산동'] },
    '방화1동': { lat: 37.5700, lon: 126.8000, name: '서울시 강서구 방화1동', type: '행정동', contains_legal_divisions: ['방화동'] },
    '방화2동': { lat: 37.5750, lon: 126.7950, name: '서울시 강서구 방화2동', type: '행정동', contains_legal_divisions: ['방화동'] },
    '방화3동': { lat: 37.5800, lon: 126.7900, name: '서울시 강서구 방화3동', type: '행정동', contains_legal_divisions: ['방화동'] },
    '공항동': { lat: 37.5600, lon: 126.7900, name: '서울시 강서구 공항동', type: '행정동', contains_legal_divisions: ['공항동', '과해동', '오곡동', '오쇠동'] },

    // 강서구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '내발산동': { lat: 37.5600, lon: 126.8200, name: '서울시 내발산동', type: '법정동', admin_parent: '발산1동' },
    '공항동_강서구': { lat: 37.5600, lon: 126.7900, name: '서울시 공항동', type: '법정동', admin_parent: '공항동' },
    '과해동': { lat: 37.5600, lon: 126.7900, name: '서울시 과해동', type: '법정동', admin_parent: '공항동' },
    '오곡동': { lat: 37.5600, lon: 126.7900, name: '서울시 오곡동', type: '법정동', admin_parent: '공항동' },
    '오쇠동': { lat: 37.5600, lon: 126.7900, name: '서울시 오쇠동', type: '법정동', admin_parent: '공항동' },


    // ===== 구로구 (행정동 및 그에 속하는 법정동) =====
    '구로구_서울': { lat: 37.4950, lon: 126.8870, name: '서울시 구로구', type: '기초자치단체' },
    '신도림동': { lat: 37.5050, lon: 126.8900, name: '서울시 구로구 신도림동', type: '행정동', contains_legal_divisions: ['신도림동'] },
    '구로1동': { lat: 37.4950, lon: 126.8950, name: '서울시 구로구 구로1동', type: '행정동', contains_legal_divisions: ['구로동'] },
    '구로2동': { lat: 37.4900, lon: 126.9000, name: '서울시 구로구 구로2동', type: '행정동', contains_legal_divisions: ['구로동'] },
    '구로3동': { lat: 37.4850, lon: 126.9050, name: '서울시 구로구 구로3동', type: '행정동', contains_legal_divisions: ['구로동'] },
    '구로4동': { lat: 37.4800, lon: 126.9100, name: '서울시 구로구 구로4동', type: '행정동', contains_legal_divisions: ['구로동'] },
    '구로5동': { lat: 37.4750, lon: 126.9150, name: '서울시 구로구 구로5동', type: '행정동', contains_legal_divisions: ['구로동'] },
    '가리봉동': { lat: 37.4800, lon: 126.8800, name: '서울시 구로구 가리봉동', type: '행정동', contains_legal_divisions: ['가리봉동'] },
    '고척1동': { lat: 37.5000, lon: 126.8500, name: '서울시 구로구 고척1동', type: '행정동', contains_legal_divisions: ['고척동'] },
    '고척2동': { lat: 37.5050, lon: 126.8550, name: '서울시 구로구 고척2동', type: '행정동', contains_legal_divisions: ['고척동'] },
    '개봉1동': { lat: 37.4900, lon: 126.8450, name: '서울시 구로구 개봉1동', type: '행정동', contains_legal_divisions: ['개봉동'] },
    '개봉2동': { lat: 37.4920, lon: 126.8500, name: '서울시 구로구 개봉2동', type: '행정동', contains_legal_divisions: ['개봉동'] },
    '개봉3동': { lat: 37.4940, lon: 126.8550, name: '서울시 구로구 개봉3동', type: '행정동', contains_legal_divisions: ['개봉동'] },
    '오류1동': { lat: 37.4800, lon: 126.8300, name: '서울시 구로구 오류1동', type: '행정동', contains_legal_divisions: ['오류동', '궁동'] },
    '오류2동': { lat: 37.4750, lon: 126.8350, name: '서울시 구로구 오류2동', type: '행정동', contains_legal_divisions: ['오류동', '천왕동', '항동'] },
    '수궁동': { lat: 37.4800, lon: 126.8250, name: '서울시 구로구 수궁동', type: '행정동', contains_legal_divisions: ['궁동', '온수동', '천왕동', '항동'] },

    // 구로구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '궁동': { lat: 37.4800, lon: 126.8300, name: '서울시 궁동', type: '법정동', admin_parent: '오류1동' },
    '천왕동': { lat: 37.4750, lon: 126.8350, name: '서울시 천왕동', type: '법정동', admin_parent: '오류2동' },
    '항동': { lat: 37.4750, lon: 126.8350, name: '서울시 항동', type: '법정동', admin_parent: '오류2동' },
    '온수동': { lat: 37.4800, lon: 126.8250, name: '서울시 온수동', type: '법정동', admin_parent: '수궁동' },


    // ===== 금천구 (행정동 및 그에 속하는 법정동) =====
    '금천구_서울': { lat: 37.4560, lon: 126.8950, name: '서울시 금천구', type: '기초자치단체' },
    '가산동': { lat: 37.4770, lon: 126.8820, name: '서울시 금천구 가산동', type: '행정동', contains_legal_divisions: ['가산동'] },
    '독산1동': { lat: 37.4700, lon: 126.8900, name: '서울시 금천구 독산1동', type: '행정동', contains_legal_divisions: ['독산동'] },
    '독산2동': { lat: 37.4650, lon: 126.8950, name: '서울시 금천구 독산2동', type: '행정동', contains_legal_divisions: ['독산동'] },
    '독산3동': { lat: 37.4600, lon: 126.9000, name: '서울시 금천구 독산3동', type: '행정동', contains_legal_divisions: ['독산동'] },
    '독산4동': { lat: 37.4550, lon: 126.9050, name: '서울시 금천구 독산4동', type: '행정동', contains_legal_divisions: ['독산동'] },
    '시흥1동': { lat: 37.4400, lon: 126.9050, name: '서울시 금천구 시흥1동', type: '행정동', contains_legal_divisions: ['시흥동'] },
    '시흥2동': { lat: 37.4350, lon: 126.9100, name: '서울시 금천구 시흥2동', type: '행정동', contains_legal_divisions: ['시흥동'] },
    '시흥3동': { lat: 37.4300, lon: 126.9150, name: '서울시 금천구 시흥3동', type: '행정동', contains_legal_divisions: ['시흥동'] },
    '시흥4동': { lat: 37.4250, lon: 126.9200, name: '서울시 금천구 시흥4동', type: '행정동', contains_legal_divisions: ['시흥동'] },
    '시흥5동': { lat: 37.4200, lon: 126.9250, name: '서울시 금천구 시흥5동', type: '행정동', contains_legal_divisions: ['시흥동'] },

    // 금천구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 금천구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 영등포구 (행정동 및 그에 속하는 법정동) =====
    '영등포구_서울': { lat: 37.5260, lon: 126.9140, name: '서울시 영등포구', type: '기초자치단체' },
    '영등포본동': { lat: 37.5250, lon: 126.9050, name: '서울시 영등포구 영등포본동', type: '행정동', contains_legal_divisions: ['영등포동'] },
    '영등포동': { lat: 37.5250, lon: 126.9050, name: '서울시 영등포구 영등포동', type: '행정동', contains_legal_divisions: ['영등포동'] },
    '여의도동': { lat: 37.5200, lon: 126.9250, name: '서울시 영등포구 여의도동', type: '행정동', contains_legal_divisions: ['여의도동'] },
    '당산1동': { lat: 37.5350, lon: 126.9000, name: '서울시 영등포구 당산1동', type: '행정동', contains_legal_divisions: ['당산동', '당산동1가', '당산동2가', '당산동3가', '당산동4가', '당산동5가', '당산동6가'] },
    '당산2동': { lat: 37.5400, lon: 126.8950, name: '서울시 영등포구 당산2동', type: '행정동', contains_legal_divisions: ['당산동', '당산동1가', '당산동2가', '당산동3가', '당산동4가', '당산동5가', '당산동6가'] },
    '도림동': { lat: 37.5050, lon: 126.9050, name: '서울시 영등포구 도림동', type: '행정동', contains_legal_divisions: ['도림동'] },
    '문래동': { lat: 37.5100, lon: 126.8900, name: '서울시 영등포구 문래동', type: '행정동', contains_legal_divisions: ['문래동1가', '문래동2가', '문래동3가', '문래동4가', '문래동5가', '문래동6가'] },
    '양평1동': { lat: 37.5300, lon: 126.8900, name: '서울시 영등포구 양평1동', type: '행정동', contains_legal_divisions: ['양평동1가', '양평동2가', '양평동3가', '양평동4가', '양평동5가', '양평동6가', '선유도동'] },
    '양평2동': { lat: 37.5350, lon: 126.8850, name: '서울시 영등포구 양평2동', type: '행정동', contains_legal_divisions: ['양평동1가', '양평동2가', '양평동3가', '양평동4가', '양평동5가', '양평동6가'] },
    '신길1동': { lat: 37.5050, lon: 126.9200, name: '서울시 영등포구 신길1동', type: '행정동', contains_legal_divisions: ['신길동'] },
    '신길3동': { lat: 37.5000, lon: 126.9150, name: '서울시 영등포구 신길3동', type: '행정동', contains_legal_divisions: ['신길동'] },
    '신길4동': { lat: 37.4950, lon: 126.9100, name: '서울시 영등포구 신길4동', type: '행정동', contains_legal_divisions: ['신길동'] },
    '신길5동': { lat: 37.4900, lon: 126.9050, name: '서울시 영등포구 신길5동', type: '행정동', contains_legal_divisions: ['신길동'] },
    '신길6동': { lat: 37.4850, lon: 126.9000, name: '서울시 영등포구 신길6동', type: '행정동', contains_legal_divisions: ['신길동'] },
    '신길7동': { lat: 37.4800, lon: 126.8950, name: '서울시 영등포구 신길7동', type: '행정동', contains_legal_divisions: ['신길동'] },
    '대림1동': { lat: 37.4950, lon: 126.8900, name: '서울시 영등포구 대림1동', type: '행정동', contains_legal_divisions: ['대림동'] },
    '대림2동': { lat: 37.4900, lon: 126.8850, name: '서울시 영등포구 대림2동', type: '행정동', contains_legal_divisions: ['대림동'] },
    '대림3동': { lat: 37.4850, lon: 126.8800, name: '서울시 영등포구 대림3동', type: '행정동', contains_legal_divisions: ['대림동'] },

    // 영등포구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '당산동1가': { lat: 37.5350, lon: 126.9000, name: '서울시 당산동1가', type: '법정동', admin_parent: '당산1동' },
    '당산동2가': { lat: 37.5350, lon: 126.9000, name: '서울시 당산동2가', type: '법정동', admin_parent: '당산1동' },
    '당산동3가': { lat: 37.5350, lon: 126.9000, name: '서울시 당산동3가', type: '법정동', admin_parent: '당산1동' },
    '당산동4가': { lat: 37.5350, lon: 126.9000, name: '서울시 당산동4가', type: '법정동', admin_parent: '당산1동' },
    '당산동5가': { lat: 37.5350, lon: 126.9000, name: '서울시 당산동5가', type: '법정동', admin_parent: '당산1동' },
    '당산동6가': { lat: 37.5350, lon: 126.9000, name: '서울시 당산동6가', type: '법정동', admin_parent: '당산1동' },
    '문래동1가': { lat: 37.5100, lon: 126.8900, name: '서울시 문래동1가', type: '법정동', admin_parent: '문래동' },
    '문래동2가': { lat: 37.5100, lon: 126.8900, name: '서울시 문래동2가', type: '법정동', admin_parent: '문래동' },
    '문래동3가': { lat: 37.5100, lon: 126.8900, name: '서울시 문래동3가', type: '법정동', admin_parent: '문래동' },
    '문래동4가': { lat: 37.5100, lon: 126.8900, name: '서울시 문래동4가', type: '법정동', admin_parent: '문래동' },
    '문래동5가': { lat: 37.5100, lon: 126.8900, name: '서울시 문래동5가', type: '법정동', admin_parent: '문래동' },
    '문래동6가': { lat: 37.5100, lon: 126.8900, name: '서울시 문래동6가', type: '법정동', admin_parent: '문래동' },
    '양평동1가': { lat: 37.5300, lon: 126.8900, name: '서울시 양평동1가', type: '법정동', admin_parent: '양평1동' },
    '양평동2가': { lat: 37.5300, lon: 126.8900, name: '서울시 양평동2가', type: '법정동', admin_parent: '양평1동' },
    '양평동3가': { lat: 37.5300, lon: 126.8900, name: '서울시 양평동3가', type: '법정동', admin_parent: '양평1동' },
    '양평동4가': { lat: 37.5300, lon: 126.8900, name: '서울시 양평동4가', type: '법정동', admin_parent: '양평1동' },
    '양평동5가': { lat: 37.5300, lon: 126.8900, name: '서울시 양평동5가', type: '법정동', admin_parent: '양평1동' },
    '양평동6가': { lat: 37.5300, lon: 126.8900, name: '서울시 양평동6가', type: '법정동', admin_parent: '양평1동' },
    '선유도동': { lat: 37.5300, lon: 126.8900, name: '서울시 선유도동', type: '법정동', admin_parent: '양평1동' },


    // ===== 동작구 (행정동 및 그에 속하는 법정동) =====
    '동작구_서울': { lat: 37.5030, lon: 126.9400, name: '서울시 동작구', type: '기초자치단체' },
    '노량진1동': { lat: 37.5130, lon: 126.9400, name: '서울시 동작구 노량진1동', type: '행정동', contains_legal_divisions: ['노량진동'] },
    '노량진2동': { lat: 37.5100, lon: 126.9450, name: '서울시 동작구 노량진2동', type: '행정동', contains_legal_divisions: ['노량진동'] },
    '상도1동': { lat: 37.5000, lon: 126.9400, name: '서울시 동작구 상도1동', type: '행정동', contains_legal_divisions: ['상도동'] },
    '상도2동': { lat: 37.4950, lon: 126.9350, name: '서울시 동작구 상도2동', type: '행정동', contains_legal_divisions: ['상도동'] },
    '상도3동': { lat: 37.4900, lon: 126.9300, name: '서울시 동작구 상도3동', type: '행정동', contains_legal_divisions: ['상도동'] },
    '상도4동': { lat: 37.4850, lon: 126.9250, name: '서울시 동작구 상도4동', type: '행정동', contains_legal_divisions: ['상도동'] },
    '흑석동': { lat: 37.5080, lon: 126.9600, name: '서울시 동작구 흑석동', type: '행정동', contains_legal_divisions: ['흑석동'] },
    '동작동': { lat: 37.4900, lon: 126.9700, name: '서울시 동작구 동작동', type: '행정동', contains_legal_divisions: ['동작동'] },
    '사당1동': { lat: 37.4850, lon: 126.9800, name: '서울시 동작구 사당1동', type: '행정동', contains_legal_divisions: ['사당동'] },
    '사당2동': { lat: 37.4800, lon: 126.9750, name: '서울시 동작구 사당2동', type: '행정동', contains_legal_divisions: ['사당동'] },
    '사당3동': { lat: 37.4750, lon: 126.9700, name: '서울시 동작구 사당3동', type: '행정동', contains_legal_divisions: ['사당동'] },
    '사당4동': { lat: 37.4700, lon: 126.9650, name: '서울시 동작구 사당4동', type: '행정동', contains_legal_divisions: ['사당동'] },
    '사당5동': { lat: 37.4650, lon: 126.9600, name: '서울시 동작구 사당5동', type: '행정동', contains_legal_divisions: ['사당동'] },
    '대방동': { lat: 37.5000, lon: 126.9250, name: '서울시 동작구 대방동', type: '행정동', contains_legal_divisions: ['대방동'] },
    '신대방1동': { lat: 37.4900, lon: 126.9150, name: '서울시 동작구 신대방1동', type: '행정동', contains_legal_divisions: ['신대방동'] },
    '신대방2동': { lat: 37.4850, lon: 126.9100, name: '서울시 동작구 신대방2동', type: '행정동', contains_legal_divisions: ['신대방동'] },

    // 동작구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 동작구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 관악구 (행정동 및 그에 속하는 법정동) =====
    '관악구_서울': { lat: 37.4780, lon: 126.9520, name: '서울시 관악구', type: '기초자치단체' },
    '보라매동': { lat: 37.4950, lon: 126.9300, name: '서울시 관악구 보라매동', type: '행정동', contains_legal_divisions: ['봉천동', '신림동'] },
    '은천동': { lat: 37.4850, lon: 126.9350, name: '서울시 관악구 은천동', type: '행정동', contains_legal_divisions: ['봉천동'] },
    '성현동': { lat: 37.4800, lon: 126.9400, name: '서울시 관악구 성현동', type: '행정동', contains_legal_divisions: ['봉천동'] },
    '중앙동': { lat: 37.4750, lon: 126.9450, name: '서울시 관악구 중앙동', type: '행정동', contains_legal_divisions: ['봉천동'] },
    '청림동': { lat: 37.4700, lon: 126.9500, name: '서울시 관악구 청림동', type: '행정동', contains_legal_divisions: ['봉천동'] },
    '행운동': { lat: 37.4650, lon: 126.9550, name: '서울시 관악구 행운동', type: '행정동', contains_legal_divisions: ['봉천동'] },
    '낙성대동': { lat: 37.4600, lon: 126.9600, name: '서울시 관악구 낙성대동', type: '행정동', contains_legal_divisions: ['봉천동'] },
    '인헌동': { lat: 37.4550, lon: 126.9650, name: '서울시 관악구 인헌동', type: '행정동', contains_legal_divisions: ['봉천동'] },
    '남현동': { lat: 37.4700, lon: 126.9700, name: '서울시 관악구 남현동', type: '행정동', contains_legal_divisions: ['남현동'] },
    '신림동_관악구': { lat: 37.4800, lon: 126.9300, name: '서울시 관악구 신림동', type: '행정동', contains_legal_divisions: ['신림동'] },
    '신림동': { lat: 37.4800, lon: 126.9300, name: '서울시 관악구 신림동', type: '행정동', contains_legal_divisions: ['신림동'] }, // 여러 신림동 행정동이 신림동 법정동을 포함
    '신사동_관악구': { lat: 37.4700, lon: 126.9100, name: '서울시 관악구 신사동', type: '행정동', contains_legal_divisions: ['신림동'] },
    '신원동': { lat: 37.4650, lon: 126.9150, name: '서울시 관악구 신원동', type: '행정동', contains_legal_divisions: ['신림동'] },
    '서원동': { lat: 37.4600, lon: 126.9200, name: '서울시 관악구 서원동', type: '행정동', contains_legal_divisions: ['신림동'] },
    '난곡동': { lat: 37.4550, lon: 126.9250, name: '서울시 관악구 난곡동', type: '행정동', contains_legal_divisions: ['신림동'] },
    '난향동': { lat: 37.4500, lon: 126.9300, name: '서울시 관악구 난향동', type: '행정동', contains_legal_divisions: ['신림동'] },
    '조원동': { lat: 37.4450, lon: 126.9350, name: '서울시 관악구 조원동', type: '행정동', contains_legal_divisions: ['신림동'] },
    '대학동': { lat: 37.4700, lon: 126.9400, name: '서울시 관악구 대학동', type: '행정동', contains_legal_divisions: ['신림동'] },
    '삼성동': { lat: 37.4650, lon: 126.9450, name: '서울시 관악구 삼성동', type: '행정동', contains_legal_divisions: ['신림동'] },
    '미성동': { lat: 37.4600, lon: 126.9500, name: '서울시 관악구 미성동', type: '행정동', contains_legal_divisions: ['신림동'] },
    '서림동': { lat: 37.4700, lon: 126.9200, name: '서울시 관악구 서림동', type: '행정동', contains_legal_divisions: ['신림동'] },
    '신림동_서림동': { lat: 37.4700, lon: 126.9200, name: '서울시 관악구 신림동', type: '법정동', admin_parent: '서림동' },
    '청룡동': { lat: 37.4750, lon: 126.9300, name: '서울시 관악구 청룡동', type: '행정동', contains_legal_divisions: ['봉천동'] },

    // 관악구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '봉천동': { lat: 37.4950, lon: 126.9300, name: '서울시 봉천동', type: '법정동', admin_parent: '보라매동' },
    '신림동': { lat: 37.4800, lon: 126.9300, name: '서울시 신림동', type: '법정동', admin_parent: '신림동_관악구' },


    // ===== 서초구 (행정동 및 그에 속하는 법정동) =====
    '서초구_서울': { lat: 37.4830, lon: 127.0320, name: '서울시 서초구', type: '기초자치단체' },
    '서초1동': { lat: 37.4900, lon: 127.0100, name: '서울시 서초구 서초1동', type: '행정동', contains_legal_divisions: ['서초동'] },
    '서초2동': { lat: 37.4850, lon: 127.0150, name: '서울시 서초구 서초2동', type: '행정동', contains_legal_divisions: ['서초동'] },
    '서초3동': { lat: 37.4800, lon: 127.0200, name: '서울시 서초구 서초3동', type: '행정동', contains_legal_divisions: ['서초동'] },
    '서초4동': { lat: 37.4750, lon: 127.0250, name: '서울시 서초구 서초4동', type: '행정동', contains_legal_divisions: ['서초동'] },
    '잠원동': { lat: 37.5180, lon: 127.0160, name: '서울시 서초구 잠원동', type: '행정동', contains_legal_divisions: ['잠원동'] },
    '반포본동': { lat: 37.5050, lon: 127.0000, name: '서울시 서초구 반포본동', type: '행정동', contains_legal_divisions: ['반포동'] },
    '반포1동': { lat: 37.5000, lon: 127.0050, name: '서울시 서초구 반포1동', type: '행정동', contains_legal_divisions: ['반포동'] },
    '반포2동': { lat: 37.4950, lon: 127.0100, name: '서울시 서초구 반포2동', type: '행정동', contains_legal_divisions: ['반포동'] },
    '반포3동': { lat: 37.4900, lon: 127.0150, name: '서울시 서초구 반포3동', type: '행정동', contains_legal_divisions: ['반포동'] },
    '반포4동': { lat: 37.4850, lon: 127.0200, name: '서울시 서초구 반포4동', type: '행정동', contains_legal_divisions: ['반포동'] },
    '방배본동': { lat: 37.4800, lon: 126.9950, name: '서울시 서초구 방배본동', type: '행정동', contains_legal_divisions: ['방배동'] },
    '방배1동': { lat: 37.4750, lon: 127.0000, name: '서울시 서초구 방배1동', type: '행정동', contains_legal_divisions: ['방배동'] },
    '방배2동': { lat: 37.4700, lon: 127.0050, name: '서울시 서초구 방배2동', type: '행정동', contains_legal_divisions: ['방배동'] },
    '방배3동': { lat: 37.4650, lon: 127.0100, name: '서울시 서초구 방배3동', type: '행정동', contains_legal_divisions: ['방배동'] },
    '방배4동': { lat: 37.4600, lon: 127.0150, name: '서울시 서초구 방배4동', type: '행정동', contains_legal_divisions: ['방배동'] },
    '양재1동': { lat: 37.4600, lon: 127.0300, name: '서울시 서초구 양재1동', type: '행정동', contains_legal_divisions: ['양재동', '원지동'] },
    '양재2동': { lat: 37.4550, lon: 127.0350, name: '서울시 서초구 양재2동', type: '행정동', contains_legal_divisions: ['양재동', '염곡동', '신원동', '내곡동'] },
    '내곡동': { lat: 37.4350, lon: 127.0700, name: '서울시 서초구 내곡동', type: '행정동', contains_legal_divisions: ['내곡동', '염곡동', '신원동'] },

    // 서초구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '원지동': { lat: 37.4600, lon: 127.0300, name: '서울시 원지동', type: '법정동', admin_parent: '양재1동' },
    '염곡동': { lat: 37.4550, lon: 127.0350, name: '서울시 염곡동', type: '법정동', admin_parent: '양재2동' },
    '신원동_서초구': { lat: 37.4550, lon: 127.0350, name: '서울시 신원동', type: '법정동', admin_parent: '양재2동' },


    // ===== 강남구 (행정동 및 그에 속하는 법정동) =====
    '강남구_서울': { lat: 37.5170, lon: 127.0470, name: '서울시 강남구', type: '기초자치단체' },
    '신사동_강남구': { lat: 37.5180, lon: 127.0200, name: '서울시 강남구 신사동', type: '행정동', contains_legal_divisions: ['신사동'] },
    '논현1동': { lat: 37.5150, lon: 127.0250, name: '서울시 강남구 논현1동', type: '행정동', contains_legal_divisions: ['논현동'] },
    '논현2동': { lat: 37.5100, lon: 127.0300, name: '서울시 강남구 논현2동', type: '행정동', contains_legal_divisions: ['논현동'] },
    '압구정동': { lat: 37.5250, lon: 127.0290, name: '서울시 강남구 압구정동', type: '행정동', contains_legal_divisions: ['압구정동'] },
    '청담동': { lat: 37.5220, lon: 127.0480, name: '서울시 강남구 청담동', type: '행정동', contains_legal_divisions: ['청담동'] },
    '삼성1동': { lat: 37.5130, lon: 127.0500, name: '서울시 강남구 삼성1동', type: '행정동', contains_legal_divisions: ['삼성동'] },
    '삼성2동': { lat: 37.5100, lon: 127.0550, name: '서울시 강남구 삼성2동', type: '행정동', contains_legal_divisions: ['삼성동'] },
    '대치1동': { lat: 37.4950, lon: 127.0600, name: '서울시 강남구 대치1동', type: '행정동', contains_legal_divisions: ['대치동'] },
    '대치2동': { lat: 37.4900, lon: 127.0650, name: '서울시 강남구 대치2동', type: '행정동', contains_legal_divisions: ['대치동'] },
    '대치4동': { lat: 37.4850, lon: 127.0700, name: '서울시 강남구 대치4동', type: '행정동', contains_legal_divisions: ['대치동'] },
    '역삼1동': { lat: 37.5000, lon: 127.0350, name: '서울시 강남구 역삼1동', type: '행정동', contains_legal_divisions: ['역삼동'] },
    '역삼2동': { lat: 37.4950, lon: 127.0400, name: '서울시 강남구 역삼2동', type: '행정동', contains_legal_divisions: ['역삼동'] },
    '도곡1동': { lat: 37.4900, lon: 127.0450, name: '서울시 강남구 도곡1동', type: '행정동', contains_legal_divisions: ['도곡동'] },
    '도곡2동': { lat: 37.4850, lon: 127.0500, name: '서울시 강남구 도곡2동', type: '행정동', contains_legal_divisions: ['도곡동'] },
    '개포1동': { lat: 37.4800, lon: 127.0550, name: '서울시 강남구 개포1동', type: '행정동', contains_legal_divisions: ['개포동'] },
    '개포2동': { lat: 37.4750, lon: 127.0600, name: '서울시 강남구 개포2동', type: '행정동', contains_legal_divisions: ['개포동'] },
    '개포4동': { lat: 37.4700, lon: 127.0650, name: '서울시 강남구 개포4동', type: '행정동', contains_legal_divisions: ['개포동'] },
    '세곡동': { lat: 37.4600, lon: 127.1000, name: '서울시 강남구 세곡동', type: '행정동', contains_legal_divisions: ['세곡동', '율현동', '자곡동', '수서동'] },
    '일원본동': { lat: 37.4800, lon: 127.0800, name: '서울시 강남구 일원본동', type: '행정동', contains_legal_divisions: ['일원동'] },
    '일원1동': { lat: 37.4750, lon: 127.0850, name: '서울시 강남구 일원1동', type: '행정동', contains_legal_divisions: ['일원동'] },
    '일원2동': { lat: 37.4700, lon: 127.0900, name: '서울시 강남구 일원2동', type: '행정동', contains_legal_divisions: ['일원동'] },
    '수서동': { lat: 37.4900, lon: 127.0950, name: '서울시 강남구 수서동', type: '행정동', contains_legal_divisions: ['수서동'] },

    // 강남구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '세곡동': { lat: 37.4600, lon: 127.1000, name: '서울시 세곡동', type: '법정동', admin_parent: '세곡동' },
    '율현동': { lat: 37.4600, lon: 127.1000, name: '서울시 율현동', type: '법정동', admin_parent: '세곡동' },
    '자곡동': { lat: 37.4600, lon: 127.1000, name: '서울시 자곡동', type: '법정동', admin_parent: '세곡동' },


    // ===== 송파구 (행정동 및 그에 속하는 법정동) =====
    '송파구_서울': { lat: 37.5145, lon: 127.1020, name: '서울시 송파구', type: '기초자치단체' },
    '잠실본동': { lat: 37.5050, lon: 127.0800, name: '서울시 송파구 잠실본동', type: '행정동', contains_legal_divisions: ['잠실동'] },
    '잠실2동': { lat: 37.5100, lon: 127.0850, name: '서울시 송파구 잠실2동', type: '행정동', contains_legal_divisions: ['잠실동'] },
    '잠실3동': { lat: 37.5150, lon: 127.0900, name: '서울시 송파구 잠실3동', type: '행정동', contains_legal_divisions: ['잠실동'] },
    '잠실4동': { lat: 37.5200, lon: 127.0950, name: '서울시 송파구 잠실4동', type: '행정동', contains_legal_divisions: ['잠실동'] },
    '잠실6동': { lat: 37.5180, lon: 127.1000, name: '서울시 송파구 잠실6동', type: '행정동', contains_legal_divisions: ['잠실동'] },
    '잠실7동': { lat: 37.5160, lon: 127.1050, name: '서울시 송파구 잠실7동', type: '행정동', contains_legal_divisions: ['잠실동'] },
    '신천동': { lat: 37.5120, lon: 127.1080, name: '서울시 송파구 신천동', type: '행정동', contains_legal_divisions: ['신천동'] },
    '풍납1동': { lat: 37.5350, lon: 127.1150, name: '서울시 송파구 풍납1동', type: '행정동', contains_legal_divisions: ['풍납동'] },
    '풍납2동': { lat: 37.5300, lon: 127.1200, name: '서울시 송파구 풍납2동', type: '행정동', contains_legal_divisions: ['풍납동'] },
    '송파1동': { lat: 37.5000, lon: 127.1100, name: '서울시 송파구 송파1동', type: '행정동', contains_legal_divisions: ['송파동'] },
    '송파2동': { lat: 37.4950, lon: 127.1150, name: '서울시 송파구 송파2동', type: '행정동', contains_legal_divisions: ['송파동'] },
    '석촌동': { lat: 37.5000, lon: 127.1000, name: '서울시 송파구 석촌동', type: '행정동', contains_legal_divisions: ['석촌동'] },
    '삼전동': { lat: 37.5050, lon: 127.0950, name: '서울시 송파구 삼전동', type: '행정동', contains_legal_divisions: ['삼전동'] },
    '가락본동': { lat: 37.4900, lon: 127.1200, name: '서울시 송파구 가락본동', type: '행정동', contains_legal_divisions: ['가락동'] },
    '가락1동': { lat: 37.4850, lon: 127.1250, name: '서울시 송파구 가락1동', type: '행정동', contains_legal_divisions: ['가락동'] },
    '가락2동': { lat: 37.4800, lon: 127.1300, name: '서울시 송파구 가락2동', type: '행정동', contains_legal_divisions: ['가락동'] },
    '문정1동': { lat: 37.4800, lon: 127.1350, name: '서울시 송파구 문정1동', type: '행정동', contains_legal_divisions: ['문정동'] },
    '문정2동': { lat: 37.4750, lon: 127.1400, name: '서울시 송파구 문정2동', type: '행정동', contains_legal_divisions: ['문정동', '장지동'] },
    '장지동': { lat: 37.4700, lon: 127.1450, name: '서울시 송파구 장지동', type: '행정동', contains_legal_divisions: ['장지동', '문정동'] },
    '위례동': { lat: 37.4800, lon: 127.1500, name: '서울시 송파구 위례동', type: '행정동', contains_legal_divisions: ['장지동', '거여동'] },
    '거여1동': { lat: 37.4900, lon: 127.1400, name: '서울시 송파구 거여1동', type: '행정동', contains_legal_divisions: ['거여동'] },
    '거여2동': { lat: 37.4950, lon: 127.1450, name: '서울시 송파구 거여2동', type: '행정동', contains_legal_divisions: ['거여동', '마천동'] },
    '마천1동': { lat: 37.5000, lon: 127.1500, name: '서울시 송파구 마천1동', type: '행정동', contains_legal_divisions: ['마천동'] },
    '마천2동': { lat: 37.5050, lon: 127.1550, name: '서울시 송파구 마천2동', type: '행정동', contains_legal_divisions: ['마천동'] },
    '오금동': { lat: 37.5000, lon: 127.1300, name: '서울시 송파구 오금동', type: '행정동', contains_legal_divisions: ['오금동'] },
    '방이1동': { lat: 37.5100, lon: 127.1150, name: '서울시 송파구 방이1동', type: '행정동', contains_legal_divisions: ['방이동'] },
    '방이2동': { lat: 37.5150, lon: 127.1200, name: '서울시 송파구 방이2동', type: '행정동', contains_legal_divisions: ['방이동'] },
    '올림픽공원동': { lat: 37.5200, lon: 127.1250, name: '서울시 송파구 올림픽공원동', type: '행정동', contains_legal_divisions: ['방이동', '오륜동'] },

    // 송파구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '장지동_송파구': { lat: 37.4700, lon: 127.1450, name: '서울시 장지동', type: '법정동', admin_parent: '장지동' },
    '오륜동': { lat: 37.5200, lon: 127.1250, name: '서울시 오륜동', type: '법정동', admin_parent: '올림픽공원동' },


    // ===== 강동구 (행정동 및 그에 속하는 법정동) =====
    '강동구_서울': { lat: 37.5300, lon: 127.1230, name: '서울시 강동구', type: '기초자치단체' },
    '강일동': { lat: 37.5600, lon: 127.1700, name: '서울시 강동구 강일동', type: '행정동', contains_legal_divisions: ['강일동', '상일동'] },
    '상일동': { lat: 37.5550, lon: 127.1650, name: '서울시 강동구 상일동', type: '행정동', contains_legal_divisions: ['상일동', '고덕동'] },
    '명일1동': { lat: 37.5500, lon: 127.1450, name: '서울시 강동구 명일1동', type: '행정동', contains_legal_divisions: ['명일동'] },
    '명일2동': { lat: 37.5450, lon: 127.1500, name: '서울시 강동구 명일2동', type: '행정동', contains_legal_divisions: ['명일동'] },
    '고덕1동': { lat: 37.5550, lon: 127.1550, name: '서울시 강동구 고덕1동', type: '행정동', contains_legal_divisions: ['고덕동'] },
    '고덕2동': { lat: 37.5500, lon: 127.1600, name: '서울시 강동구 고덕2동', type: '행정동', contains_legal_divisions: ['고덕동', '암사동'] },
    '암사1동': { lat: 37.5500, lon: 127.1350, name: '서울시 강동구 암사1동', type: '행정동', contains_legal_divisions: ['암사동'] },
    '암사2동': { lat: 37.5520, lon: 127.1400, name: '서울시 강동구 암사2동', type: '행정동', contains_legal_divisions: ['암사동'] },
    '암사3동': { lat: 37.5540, lon: 127.1450, name: '서울시 강동구 암사3동', type: '행정동', contains_legal_divisions: ['암사동'] },
    '천호1동': { lat: 37.5380, lon: 127.1250, name: '서울시 강동구 천호1동', type: '행정동', contains_legal_divisions: ['천호동'] },
    '천호2동': { lat: 37.5350, lon: 127.1300, name: '서울시 강동구 천호2동', type: '행정동', contains_legal_divisions: ['천호동'] },
    '천호3동': { lat: 37.5320, lon: 127.1350, name: '서울시 강동구 천호3동', type: '행정동', contains_legal_divisions: ['천호동'] },
    '성내1동': { lat: 37.5300, lon: 127.1200, name: '서울시 강동구 성내1동', type: '행정동', contains_legal_divisions: ['성내동'] },
    '성내2동': { lat: 37.5280, lon: 127.1250, name: '서울시 강동구 성내2동', type: '행정동', contains_legal_divisions: ['성내동'] },
    '성내3동': { lat: 37.5260, lon: 127.1300, name: '서울시 강동구 성내3동', type: '행정동', contains_legal_divisions: ['성내동'] },
    '둔촌1동': { lat: 37.5200, lon: 127.1400, name: '서울시 강동구 둔촌1동', type: '행정동', contains_legal_divisions: ['둔촌동'] },
    '둔촌2동': { lat: 37.5180, lon: 127.1450, name: '서울시 강동구 둔촌2동', type: '행정동', contains_legal_divisions: ['둔촌동'] },
    '길동': { lat: 37.5400, lon: 127.1350, name: '서울시 강동구 길동', type: '행정동', contains_legal_divisions: ['길동'] },

    // 강동구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '강일동': { lat: 37.5600, lon: 127.1700, name: '서울시 강일동', type: '법정동', admin_parent: '강일동' },
    '상일동_강동구': { lat: 37.5550, lon: 127.1650, name: '서울시 상일동', type: '법정동', admin_parent: '상일동' },


  // ===== 부산광역시 데이터 시작 =====
    '부산': { lat: 35.1796, lon: 129.0756, name: '부산시', type: '광역자치단체', aliases: ['부산광역시', '부산'] },
    '부산시': { lat: 35.1796, lon: 129.0756, name: '부산시', type: '광역자치단체', aliases: ['부산광역시', '부산'] },

    // ===== 중구 (행정동 및 그에 속하는 법정동) =====
    '중구_부산': { lat: 35.1054, lon: 129.0345, name: '부산시 중구', type: '기초자치단체' },
    '중앙동_부산': { lat: 35.1020, lon: 129.0330, name: '부산시 중구 중앙동', type: '행정동', contains_legal_divisions: ['중앙동1가', '중앙동2가', '중앙동3가', '중앙동4가', '중앙동5가', '중앙동6가', '중앙동7가', '대창동1가', '대창동2가'] },
    '동광동_부산': { lat: 35.1000, lon: 129.0350, name: '부산시 중구 동광동', type: '행정동', contains_legal_divisions: ['동광동1가', '동광동2가', '동광동3가', '동광동4가', '동광동5가'] },
    '대청동_부산': { lat: 35.0970, lon: 129.0380, name: '부산시 중구 대청동', type: '행정동', contains_legal_divisions: ['대청동1가', '대청동2가', '대청동3가', '대청동4가'] },
    '보수동_부산': { lat: 35.1010, lon: 129.0250, name: '부산시 중구 보수동', type: '행정동', contains_legal_divisions: ['보수동1가', '보수동2가', '보수동3가'] },
    '부평동_부산': { lat: 35.1030, lon: 129.0280, name: '부산시 중구 부평동', type: '행정동', contains_legal_divisions: ['부평동1가', '부평동2가', '부평동3가', '부평동4가'] },
    '광복동_부산': { lat: 35.0960, lon: 129.0310, name: '부산시 중구 광복동', type: '행정동', contains_legal_divisions: ['광복동1가', '광복동2가', '광복동3가'] },
    '남포동_부산': { lat: 35.0930, lon: 129.0300, name: '부산시 중구 남포동', type: '행정동', contains_legal_divisions: ['남포동1가', '남포동2가', '남포동3가', '남포동4가', '남포동5가', '남포동6가'] },
    '영주동_부산': { lat: 35.1100, lon: 129.0300, name: '부산시 중구 영주동', type: '행정동', contains_legal_divisions: ['영주동1가', '영주동2가'] },
    '복합동_부산': { lat: 35.0980, lon: 129.0280, name: '부산시 중구 복합동', type: '행정동', contains_legal_divisions: ['창선동1가', '창선동2가', '신창동1가', '신창동2가', '신창동3가', '신창동4가', '대교동1가', '대교동2가'] },

    // 중구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '중앙동1가_부산': { lat: 35.1020, lon: 129.0330, name: '부산시 중앙동1가', type: '법정동', admin_parent: '중앙동_부산' },
    '중앙동2가_부산': { lat: 35.1020, lon: 129.0330, name: '부산시 중앙동2가', type: '법정동', admin_parent: '중앙동_부산' },
    '중앙동3가_부산': { lat: 35.1020, lon: 129.0330, name: '부산시 중앙동3가', type: '법정동', admin_parent: '중앙동_부산' },
    '중앙동4가_부산': { lat: 35.1020, lon: 129.0330, name: '부산시 중앙동4가', type: '법정동', admin_parent: '중앙동_부산' },
    '중앙동5가_부산': { lat: 35.1020, lon: 129.0330, name: '부산시 중앙동5가', type: '법정동', admin_parent: '중앙동_부산' },
    '중앙동6가_부산': { lat: 35.1020, lon: 129.0330, name: '부산시 중앙동6가', type: '법정동', admin_parent: '중앙동_부산' },
    '중앙동7가_부산': { lat: 35.1020, lon: 129.0330, name: '부산시 중앙동7가', type: '법정동', admin_parent: '중앙동_부산' },
    '대창동1가_부산': { lat: 35.1020, lon: 129.0330, name: '부산시 대창동1가', type: '법정동', admin_parent: '중앙동_부산' },
    '대창동2가_부산': { lat: 35.1020, lon: 129.0330, name: '부산시 대창동2가', type: '법정동', admin_parent: '중앙동_부산' },
    '동광동1가_부산': { lat: 35.1000, lon: 129.0350, name: '부산시 동광동1가', type: '법정동', admin_parent: '동광동_부산' },
    '동광동2가_부산': { lat: 35.1000, lon: 129.0350, name: '부산시 동광동2가', type: '법정동', admin_parent: '동광동_부산' },
    '동광동3가_부산': { lat: 35.1000, lon: 129.0350, name: '부산시 동광동3가', type: '법정동', admin_parent: '동광동_부산' },
    '동광동4가_부산': { lat: 35.1000, lon: 129.0350, name: '부산시 동광동4가', type: '법정동', admin_parent: '동광동_부산' },
    '동광동5가_부산': { lat: 35.1000, lon: 129.0350, name: '부산시 동광동5가', type: '법정동', admin_parent: '동광동_부산' },
    '대청동1가_부산': { lat: 35.0970, lon: 129.0380, name: '부산시 대청동1가', type: '법정동', admin_parent: '대청동_부산' },
    '대청동2가_부산': { lat: 35.0970, lon: 129.0380, name: '부산시 대청동2가', type: '법정동', admin_parent: '대청동_부산' },
    '대청동3가_부산': { lat: 35.0970, lon: 129.0380, name: '부산시 대청동3가', type: '법정동', admin_parent: '대청동_부산' },
    '대청동4가_부산': { lat: 35.0970, lon: 129.0380, name: '부산시 대청동4가', type: '법정동', admin_parent: '대청동_부산' },
    '보수동1가_부산': { lat: 35.1010, lon: 129.0250, name: '부산시 보수동1가', type: '법정동', admin_parent: '보수동_부산' },
    '보수동2가_부산': { lat: 35.1010, lon: 129.0250, name: '부산시 보수동2가', type: '법정동', admin_parent: '보수동_부산' },
    '보수동3가_부산': { lat: 35.1010, lon: 129.0250, name: '부산시 보수동3가', type: '법정동', admin_parent: '보수동_부산' },
    '부평동1가_부산': { lat: 35.1030, lon: 129.0280, name: '부산시 부평동1가', type: '법정동', admin_parent: '부평동_부산' },
    '부평동2가_부산': { lat: 35.1030, lon: 129.0280, name: '부산시 부평동2가', type: '법정동', admin_parent: '부평동_부산' },
    '부평동3가_부산': { lat: 35.1030, lon: 129.0280, name: '부산시 부평동3가', type: '법정동', admin_parent: '부평동_부산' },
    '부평동4가_부산': { lat: 35.1030, lon: 129.0280, name: '부산시 부평동4가', type: '법정동', admin_parent: '부평동_부산' },
    '광복동1가_부산': { lat: 35.0960, lon: 129.0310, name: '부산시 광복동1가', type: '법정동', admin_parent: '광복동_부산' },
    '광복동2가_부산': { lat: 35.0960, lon: 129.0310, name: '부산시 광복동2가', type: '법정동', admin_parent: '광복동_부산' },
    '광복동3가_부산': { lat: 35.0960, lon: 129.0310, name: '부산시 광복동3가', type: '법정동', admin_parent: '광복동_부산' },
    '남포동1가_부산': { lat: 35.0930, lon: 129.0300, name: '부산시 남포동1가', type: '법정동', admin_parent: '남포동_부산' },
    '남포동2가_부산': { lat: 35.0930, lon: 129.0300, name: '부산시 남포동2가', type: '법정동', admin_parent: '남포동_부산' },
    '남포동3가_부산': { lat: 35.0930, lon: 129.0300, name: '부산시 남포동3가', type: '법정동', admin_parent: '남포동_부산' },
    '남포동4가_부산': { lat: 35.0930, lon: 129.0300, name: '부산시 남포동4가', type: '법정동', admin_parent: '남포동_부산' },
    '남포동5가_부산': { lat: 35.0930, lon: 129.0300, name: '부산시 남포동5가', type: '법정동', admin_parent: '남포동_부산' },
    '남포동6가_부산': { lat: 35.0930, lon: 129.0300, name: '부산시 남포동6가', type: '법정동', admin_parent: '남포동_부산' },
    '영주동1가_부산': { lat: 35.1100, lon: 129.0300, name: '부산시 영주동1가', type: '법정동', admin_parent: '영주동_부산' },
    '영주동2가_부산': { lat: 35.1100, lon: 129.0300, name: '부산시 영주동2가', type: '법정동', admin_parent: '영주동_부산' },
    '창선동1가_부산': { lat: 35.0980, lon: 129.0280, name: '부산시 창선동1가', type: '법정동', admin_parent: '복합동_부산' },
    '창선동2가_부산': { lat: 35.0980, lon: 129.0280, name: '부산시 창선동2가', type: '법정동', admin_parent: '복합동_부산' },
    '신창동1가_부산': { lat: 35.0980, lon: 129.0280, name: '부산시 신창동1가', type: '법정동', admin_parent: '복합동_부산' },
    '신창동2가_부산': { lat: 35.0980, lon: 129.0280, name: '부산시 신창동2가', type: '법정동', admin_parent: '복합동_부산' },
    '신창동3가_부산': { lat: 35.0980, lon: 129.0280, name: '부산시 신창동3가', type: '법정동', admin_parent: '복합동_부산' },
    '신창동4가_부산': { lat: 35.0980, lon: 129.0280, name: '부산시 신창동4가', type: '법정동', admin_parent: '복합동_부산' },
    '대교동1가_부산': { lat: 35.0980, lon: 129.0280, name: '부산시 대교동1가', type: '법정동', admin_parent: '복합동_부산' },
    '대교동2가_부산': { lat: 35.0980, lon: 129.0280, name: '부산시 대교동2가', type: '법정동', admin_parent: '복합동_부산' },


    // ===== 서구 (행정동 및 그에 속하는 법정동) =====
    '서구_부산': { lat: 35.0939, lon: 129.0210, name: '부산시 서구', type: '기초자치단체' },
    '동대신1동': { lat: 35.1050, lon: 129.0150, name: '부산시 서구 동대신1동', type: '행정동', contains_legal_divisions: ['동대신동1가', '동대신동2가'] },
    '동대신2동': { lat: 35.1070, lon: 129.0180, name: '부산시 서구 동대신2동', type: '행정동', contains_legal_divisions: ['동대신동2가'] },
    '동대신3동': { lat: 35.1090, lon: 129.0210, name: '부산시 서구 동대신3동', type: '행정동', contains_legal_divisions: ['동대신동3가'] },
    '서대신1동': { lat: 35.1020, lon: 129.0050, name: '부산시 서구 서대신1동', type: '행정동', contains_legal_divisions: ['서대신동1가'] },
    '서대신3동': { lat: 35.1040, lon: 129.0080, name: '부산시 서구 서대신3동', type: '행정동', contains_legal_divisions: ['서대신동3가'] },
    '서대신4동': { lat: 35.1060, lon: 129.0110, name: '부산시 서구 서대신4동', type: '행정동', contains_legal_divisions: ['서대신동4가'] },
    '부민동': { lat: 35.0960, lon: 129.0200, name: '부산시 서구 부민동', type: '행정동', contains_legal_divisions: ['부민동1가', '부민동2가', '부민동3가'] },
    '아미동': { lat: 35.0930, lon: 129.0150, name: '부산시 서구 아미동', type: '행정동', contains_legal_divisions: ['아미동1가', '아미동2가'] },
    '초장동': { lat: 35.0950, lon: 129.0050, name: '부산시 서구 초장동', type: '행정동', contains_legal_divisions: ['초장동'] },
    '충무동': { lat: 35.0910, lon: 129.0250, name: '부산시 서구 충무동', type: '행정동', contains_legal_divisions: ['충무동1가', '충무동2가', '충무동3가', '남부민동', '암남동'] },
    '남부민1동': { lat: 35.0880, lon: 129.0180, name: '부산시 서구 남부민1동', type: '행정동', contains_legal_divisions: ['남부민동'] },
    '남부민2동': { lat: 35.0860, lon: 129.0150, name: '부산시 서구 남부민2동', type: '행정동', contains_legal_divisions: ['남부민동'] },
    '암남동': { lat: 35.0800, lon: 129.0000, name: '부산시 서구 암남동', type: '행정동', contains_legal_divisions: ['암남동'] },

    // 서구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '동대신동1가_부산': { lat: 35.1050, lon: 129.0150, name: '부산시 동대신동1가', type: '법정동', admin_parent: '동대신1동' },
    '동대신동2가_부산': { lat: 35.1050, lon: 129.0150, name: '부산시 동대신동2가', type: '법정동', admin_parent: '동대신1동' },
    '동대신동3가_부산': { lat: 35.1090, lon: 129.0210, name: '부산시 동대신동3가', type: '법정동', admin_parent: '동대신3동' },
    '서대신동1가_부산': { lat: 35.1020, lon: 129.0050, name: '부산시 서대신동1가', type: '법정동', admin_parent: '서대신1동' },
    '서대신동3가_부산': { lat: 35.1040, lon: 129.0080, name: '부산시 서대신동3가', type: '법정동', admin_parent: '서대신3동' },
    '서대신동4가_부산': { lat: 35.1060, lon: 129.0110, name: '부산시 서대신동4가', type: '법정동', admin_parent: '서대신4동' },
    '부민동1가_부산': { lat: 35.0960, lon: 129.0200, name: '부산시 부민동1가', type: '법정동', admin_parent: '부민동' },
    '부민동2가_부산': { lat: 35.0960, lon: 129.0200, name: '부산시 부민동2가', type: '법정동', admin_parent: '부민동' },
    '부민동3가_부산': { lat: 35.0960, lon: 129.0200, name: '부산시 부민동3가', type: '법정동', admin_parent: '부민동' },
    '아미동1가_부산': { lat: 35.0930, lon: 129.0150, name: '부산시 아미동1가', type: '법정동', admin_parent: '아미동' },
    '아미동2가_부산': { lat: 35.0930, lon: 129.0150, name: '부산시 아미동2가', type: '법정동', admin_parent: '아미동' },
    '초장동_부산': { lat: 35.0950, lon: 129.0050, name: '부산시 초장동', type: '법정동', admin_parent: '초장동' },
    '충무동1가_부산': { lat: 35.0910, lon: 129.0250, name: '부산시 충무동1가', type: '법정동', admin_parent: '충무동' },
    '충무동2가_부산': { lat: 35.0910, lon: 129.0250, name: '부산시 충무동2가', type: '법정동', admin_parent: '충무동' },
    '충무동3가_부산': { lat: 35.0910, lon: 129.0250, name: '부산시 충무동3가', type: '법정동', admin_parent: '충무동' },
    '남부민동_부산': { lat: 35.0880, lon: 129.0180, name: '부산시 남부민동', type: '법정동', admin_parent: '남부민1동' },
    '암남동_부산': { lat: 35.0800, lon: 129.0000, name: '부산시 암남동', type: '법정동', admin_parent: '암남동' },


    // ===== 동구 (행정동 및 그에 속하는 법정동) =====
    '동구_부산': { lat: 35.1328, lon: 129.0433, name: '부산시 동구', type: '기초자치단체' },
    '초량1동': { lat: 35.1220, lon: 129.0350, name: '부산시 동구 초량1동', type: '행정동', contains_legal_divisions: ['초량동'] },
    '초량2동': { lat: 35.1250, lon: 129.0380, name: '부산시 동구 초량2동', type: '행정동', contains_legal_divisions: ['초량동'] },
    '초량3동': { lat: 35.1280, lon: 129.0410, name: '부산시 동구 초량3동', type: '행정동', contains_legal_divisions: ['초량동'] },
    '초량4동': { lat: 35.1310, lon: 129.0440, name: '부산시 동구 초량4동', type: '행정동', contains_legal_divisions: ['초량동'] },
    '초량5동': { lat: 35.1340, lon: 129.0470, name: '부산시 동구 초량5동', type: '행정동', contains_legal_divisions: ['초량동'] },
    '수정1동': { lat: 35.1300, lon: 129.0500, name: '부산시 동구 수정1동', type: '행정동', contains_legal_divisions: ['수정동'] },
    '수정2동': { lat: 35.1330, lon: 129.0530, name: '부산시 동구 수정2동', type: '행정동', contains_legal_divisions: ['수정동'] },
    '수정4동': { lat: 35.1360, lon: 129.0560, name: '부산시 동구 수정4동', type: '행정동', contains_legal_divisions: ['수정동'] },
    '수정5동': { lat: 35.1390, lon: 129.0590, name: '부산시 동구 수정5동', type: '행정동', contains_legal_divisions: ['수정동'] },
    '좌천동': { lat: 35.1250, lon: 129.0600, name: '부산시 동구 좌천동', type: '행정동', contains_legal_divisions: ['좌천동'] },
    '범일1동': { lat: 35.1300, lon: 129.0650, name: '부산시 동구 범일1동', type: '행정동', contains_legal_divisions: ['범일동'] },
    '범일2동': { lat: 35.1330, lon: 129.0680, name: '부산시 동구 범일2동', type: '행정동', contains_legal_divisions: ['범일동'] },
    '범일5동': { lat: 35.1360, lon: 129.0710, name: '부산시 동구 범일5동', type: '행정동', contains_legal_divisions: ['범일동'] },

    // 동구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 동구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 영도구 (행정동 및 그에 속하는 법정동) =====
    '영도구': { lat: 35.0934, lon: 129.0715, name: '부산시 영도구', type: '기초자치단체' },
    '남항동': { lat: 35.0910, lon: 129.0450, name: '부산시 영도구 남항동', type: '행정동', contains_legal_divisions: ['남항동1가', '남항동2가', '남항동3가', '대교동1가', '대교동2가'] },
    '영선1동': { lat: 35.0950, lon: 129.0480, name: '부산시 영도구 영선1동', type: '행정동', contains_legal_divisions: ['영선동1가', '영선동2가'] },
    '영선2동': { lat: 35.0970, lon: 129.0510, name: '부산시 영도구 영선2동', type: '행정동', contains_legal_divisions: ['영선동2가'] },
    '신선동': { lat: 35.0990, lon: 129.0540, name: '부산시 영도구 신선동', type: '행정동', contains_legal_divisions: ['신선동1가', '신선동2가', '신선동3가'] },
    '봉래1동': { lat: 35.0880, lon: 129.0500, name: '부산시 영도구 봉래1동', type: '행정동', contains_legal_divisions: ['봉래동1가', '봉래동2가', '봉래동3가', '봉래동4가', '봉래동5가'] },
    '봉래2동': { lat: 35.0900, lon: 129.0530, name: '부산시 영도구 봉래2동', type: '행정동', contains_legal_divisions: ['봉래동'] },
    '청학1동': { lat: 35.0950, lon: 129.0600, name: '부산시 영도구 청학1동', type: '행정동', contains_legal_divisions: ['청학동'] },
    '청학2동': { lat: 35.0980, lon: 129.0630, name: '부산시 영도구 청학2동', type: '행정동', contains_legal_divisions: ['청학동'] },
    '동삼1동': { lat: 35.0750, lon: 129.0700, name: '부산시 영도구 동삼1동', type: '행정동', contains_legal_divisions: ['동삼동'] },
    '동삼2동': { lat: 35.0780, lon: 129.0730, name: '부산시 영도구 동삼2동', type: '행정동', contains_legal_divisions: ['동삼동'] },
    '동삼3동': { lat: 35.0810, lon: 129.0760, name: '부산시 영도구 동삼3동', type: '행정동', contains_legal_divisions: ['동삼동'] },

    // 영도구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '남항동1가_영도구': { lat: 35.0910, lon: 129.0450, name: '부산시 남항동1가', type: '법정동', admin_parent: '남항동' },
    '남항동2가_영도구': { lat: 35.0910, lon: 129.0450, name: '부산시 남항동2가', type: '법정동', admin_parent: '남항동' },
    '남항동3가_영도구': { lat: 35.0910, lon: 129.0450, name: '부산시 남항동3가', type: '법정동', admin_parent: '남항동' },
    '대교동1가_영도구': { lat: 35.0910, lon: 129.0450, name: '부산시 대교동1가', type: '법정동', admin_parent: '남항동' },
    '대교동2가_영도구': { lat: 35.0910, lon: 129.0450, name: '부산시 대교동2가', type: '법정동', admin_parent: '남항동' },
    '영선동1가_영도구': { lat: 35.0950, lon: 129.0480, name: '부산시 영선동1가', type: '법정동', admin_parent: '영선1동' },
    '영선동2가_영도구': { lat: 35.0950, lon: 129.0480, name: '부산시 영선동2가', type: '법정동', admin_parent: '영선1동' },
    '신선동1가_영도구': { lat: 35.0990, lon: 129.0540, name: '부산시 신선동1가', type: '법정동', admin_parent: '신선동' },
    '신선동2가_영도구': { lat: 35.0990, lon: 129.0540, name: '부산시 신선동2가', type: '법정동', admin_parent: '신선동' },
    '신선동3가_영도구': { lat: 35.0990, lon: 129.0540, name: '부산시 신선동3가', type: '법정동', admin_parent: '신선동' },
    '봉래동1가_영도구': { lat: 35.0880, lon: 129.0500, name: '부산시 봉래동1가', type: '법정동', admin_parent: '봉래1동' },
    '봉래동2가_영도구': { lat: 35.0880, lon: 129.0500, name: '부산시 봉래동2가', type: '법정동', admin_parent: '봉래1동' },
    '봉래동3가_영도구': { lat: 35.0880, lon: 129.0500, name: '부산시 봉래동3가', type: '법정동', admin_parent: '봉래1동' },
    '봉래동4가_영도구': { lat: 35.0880, lon: 129.0500, name: '부산시 봉래동4가', type: '법정동', admin_parent: '봉래1동' },
    '봉래동5가_영도구': { lat: 35.0880, lon: 129.0500, name: '부산시 봉래동5가', type: '법정동', admin_parent: '봉래1동' },
    // '청학동' 및 '동삼동' 법정동은 행정동과 이름이 같으므로 개별 항목 없음.


    // ===== 부산진구 (행정동 및 그에 속하는 법정동) =====
    '부산진구': { lat: 35.1837, lon: 129.0508, name: '부산시 부산진구', type: '기초자치단체' },
    '부전1동': { lat: 35.1580, lon: 129.0590, name: '부산시 부산진구 부전1동', type: '행정동', contains_legal_divisions: ['부전동'] },
    '부전2동': { lat: 35.1610, lon: 129.0620, name: '부산시 부산진구 부전2동', type: '행정동', contains_legal_divisions: ['부전동'] },
    '연지동': { lat: 35.1650, lon: 129.0550, name: '부산시 부산진구 연지동', type: '행정동', contains_legal_divisions: ['연지동'] },
    '초읍동': { lat: 35.1700, lon: 129.0500, name: '부산시 부산진구 초읍동', type: '행정동', contains_legal_divisions: ['초읍동'] },
    '양정1동': { lat: 35.1800, lon: 129.0700, name: '부산시 부산진구 양정1동', type: '행정동', contains_legal_divisions: ['양정동'] },
    '양정2동': { lat: 35.1830, lon: 129.0730, name: '부산시 부산진구 양정2동', type: '행정동', contains_legal_divisions: ['양정동'] },
    '전포1동': { lat: 35.1480, lon: 129.0680, name: '부산시 부산진구 전포1동', type: '행정동', contains_legal_divisions: ['전포동'] },
    '전포2동': { lat: 35.1510, lon: 129.0710, name: '부산시 부산진구 전포2동', type: '행정동', contains_legal_divisions: ['전포동'] },
    '부암1동': { lat: 35.1700, lon: 129.0400, name: '부산시 부산진구 부암1동', type: '행정동', contains_legal_divisions: ['부암동'] },
    '부암3동': { lat: 35.1730, lon: 129.0430, name: '부산시 부산진구 부암3동', type: '행정동', contains_legal_divisions: ['부암동'] },
    '당감1동': { lat: 35.1750, lon: 129.0300, name: '부산시 부산진구 당감1동', type: '행정동', contains_legal_divisions: ['당감동'] },
    '당감2동': { lat: 35.1780, lon: 129.0330, name: '부산시 부산진구 당감2동', type: '행정동', contains_legal_divisions: ['당감동'] },
    '당감4동': { lat: 35.1810, lon: 129.0360, name: '부산시 부산진구 당감4동', type: '행정동', contains_legal_divisions: ['당감동'] },
    '개금1동': { lat: 35.1500, lon: 129.0150, name: '부산시 부산진구 개금1동', type: '행정동', contains_legal_divisions: ['개금동'] },
    '개금2동': { lat: 35.1530, lon: 129.0180, name: '부산시 부산진구 개금2동', type: '행정동', contains_legal_divisions: ['개금동'] },
    '개금3동': { lat: 35.1560, lon: 129.0210, name: '부산시 부산진구 개금3동', type: '행정동', contains_legal_divisions: ['개금동'] },
    '범천1동': { lat: 35.1400, lon: 129.0450, name: '부산시 부산진구 범천1동', type: '행정동', contains_legal_divisions: ['범천동'] },
    '범천2동': { lat: 35.1430, lon: 129.0480, name: '부산시 부산진구 범천2동', type: '행정동', contains_legal_divisions: ['범천동'] },

    // 부산진구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 부산진구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 동래구 (행정동 및 그에 속하는 법정동) =====
    '동래구': { lat: 35.2017, lon: 129.0883, name: '부산시 동래구', type: '기초자치단체' },
    '수민동': { lat: 35.2000, lon: 129.0800, name: '부산시 동래구 수민동', type: '행정동', contains_legal_divisions: ['수민동'] }, // 법정동 명칭이 수민동
    '복산동': { lat: 35.2050, lon: 129.0830, name: '부산시 동래구 복산동', type: '행정동', contains_legal_divisions: ['복천동'] },
    '명륜동': { lat: 35.2080, lon: 129.0860, name: '부산시 동래구 명륜동', type: '행정동', contains_legal_divisions: ['명륜동'] },
    '온천1동': { lat: 35.2100, lon: 129.0700, name: '부산시 동래구 온천1동', type: '행정동', contains_legal_divisions: ['온천동'] },
    '온천2동': { lat: 35.2130, lon: 129.0730, name: '부산시 동래구 온천2동', type: '행정동', contains_legal_divisions: ['온천동'] },
    '온천3동': { lat: 35.2160, lon: 129.0760, name: '부산시 동래구 온천3동', type: '행정동', contains_legal_divisions: ['온천동'] },
    '사직1동': { lat: 35.1950, lon: 129.0650, name: '부산시 동래구 사직1동', type: '행정동', contains_legal_divisions: ['사직동'] },
    '사직2동': { lat: 35.1980, lon: 129.0680, name: '부산시 동래구 사직2동', type: '행정동', contains_legal_divisions: ['사직동'] },
    '사직3동': { lat: 35.2010, lon: 129.0710, name: '부산시 동래구 사직3동', type: '행정동', contains_legal_divisions: ['사직동'] },
    '안락1동': { lat: 35.2000, lon: 129.1000, name: '부산시 동래구 안락1동', type: '행정동', contains_legal_divisions: ['안락동'] },
    '안락2동': { lat: 35.2030, lon: 129.1030, name: '부산시 동래구 안락2동', type: '행정동', contains_legal_divisions: ['안락동'] },
    '명장1동': { lat: 35.2100, lon: 129.1050, name: '부산시 동래구 명장1동', type: '행정동', contains_legal_divisions: ['명장동'] },
    '명장2동': { lat: 35.2130, lon: 129.1080, name: '부산시 동래구 명장2동', type: '행정동', contains_legal_divisions: ['명장동'] },

    // 동래구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '복천동_부산': { lat: 35.2050, lon: 129.0830, name: '부산시 복천동', type: '법정동', admin_parent: '복산동' },


    // ===== 남구 (행정동 및 그에 속하는 법정동) =====
    '남구_부산': { lat: 35.1378, lon: 129.0863, name: '부산시 남구', type: '기초자치단체' },
    '대연1동': { lat: 35.1350, lon: 129.0900, name: '부산시 남구 대연1동', type: '행정동', contains_legal_divisions: ['대연동'] },
    '대연3동': { lat: 35.1380, lon: 129.0930, name: '부산시 남구 대연3동', type: '행정동', contains_legal_divisions: ['대연동'] },
    '대연4동': { lat: 35.1410, lon: 129.0960, name: '부산시 남구 대연4동', type: '행정동', contains_legal_divisions: ['대연동'] },
    '대연5동': { lat: 35.1440, lon: 129.0990, name: '부산시 남구 대연5동', type: '행정동', contains_legal_divisions: ['대연동'] },
    '대연6동': { lat: 35.1470, lon: 129.1020, name: '부산시 남구 대연6동', type: '행정동', contains_legal_divisions: ['대연동'] },
    '용호1동': { lat: 35.1100, lon: 129.1100, name: '부산시 남구 용호1동', type: '행정동', contains_legal_divisions: ['용호동'] },
    '용호2동': { lat: 35.1130, lon: 129.1130, name: '부산시 남구 용호2동', type: '행정동', contains_legal_divisions: ['용호동'] },
    '용호3동': { lat: 35.1160, lon: 129.1160, name: '부산시 남구 용호3동', type: '행정동', contains_legal_divisions: ['용호동'] },
    '용호4동': { lat: 35.1190, lon: 129.1190, name: '부산시 남구 용호4동', type: '행정동', contains_legal_divisions: ['용호동'] },
    '용당동': { lat: 35.1300, lon: 129.1050, name: '부산시 남구 용당동', type: '행정동', contains_legal_divisions: ['용당동'] },
    '감만1동': { lat: 35.1200, lon: 129.0800, name: '부산시 남구 감만1동', type: '행정동', contains_legal_divisions: ['감만동'] },
    '감만2동': { lat: 35.1230, lon: 129.0830, name: '부산시 남구 감만2동', type: '행정동', contains_legal_divisions: ['감만동'] },
    '우암동': { lat: 35.1300, lon: 129.0750, name: '부산시 남구 우암동', type: '행정동', contains_legal_divisions: ['우암동'] },
    '문현1동': { lat: 35.1400, lon: 129.0700, name: '부산시 남구 문현1동', type: '행정동', contains_legal_divisions: ['문현동'] },
    '문현2동': { lat: 35.1430, lon: 129.0730, name: '부산시 남구 문현2동', type: '행정동', contains_legal_divisions: ['문현동'] },
    '문현3동': { lat: 35.1460, lon: 129.0760, name: '부산시 남구 문현3동', type: '행정동', contains_legal_divisions: ['문현동'] },

    // 남구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 남구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 북구 (행정동 및 그에 속하는 법정동) =====
    '북구_부산': { lat: 35.2167, lon: 128.9950, name: '부산시 북구', type: '기초자치단체' },
    '구포1동': { lat: 35.2000, lon: 128.9800, name: '부산시 북구 구포1동', type: '행정동', contains_legal_divisions: ['구포동'] },
    '구포2동': { lat: 35.2030, lon: 128.9830, name: '부산시 북구 구포2동', type: '행정동', contains_legal_divisions: ['구포동'] },
    '구포3동': { lat: 35.2060, lon: 128.9860, name: '부산시 북구 구포3동', type: '행정동', contains_legal_divisions: ['구포동'] },
    '금곡동_부산': { lat: 35.2400, lon: 128.9900, name: '부산시 북구 금곡동', type: '행정동', contains_legal_divisions: ['금곡동'] },
    '화명1동': { lat: 35.2450, lon: 129.0000, name: '부산시 북구 화명1동', type: '행정동', contains_legal_divisions: ['화명동'] },
    '화명2동': { lat: 35.2480, lon: 129.0030, name: '부산시 북구 화명2동', type: '행정동', contains_legal_divisions: ['화명동'] },
    '화명3동': { lat: 35.2510, lon: 129.0060, name: '부산시 북구 화명3동', type: '행정동', contains_legal_divisions: ['화명동'] },
    '덕천1동': { lat: 35.2200, lon: 128.9900, name: '부산시 북구 덕천1동', type: '행정동', contains_legal_divisions: ['덕천동'] },
    '덕천2동': { lat: 35.2230, lon: 128.9930, name: '부산시 북구 덕천2동', type: '행정동', contains_legal_divisions: ['덕천동'] },
    '덕천3동': { lat: 35.2260, lon: 128.9960, name: '부산시 북구 덕천3동', type: '행정동', contains_legal_divisions: ['덕천동'] },
    '만덕1동': { lat: 35.2100, lon: 129.0100, name: '부산시 북구 만덕1동', type: '행정동', contains_legal_divisions: ['만덕동'] },
    '만덕2동': { lat: 35.2130, lon: 129.0130, name: '부산시 북구 만덕2동', type: '행정동', contains_legal_divisions: ['만덕동'] },
    '만덕3동': { lat: 35.2160, lon: 129.0160, name: '부산시 북구 만덕3동', type: '행정동', contains_legal_divisions: ['만덕동'] },

    // 북구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 북구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 해운대구 (행정동 및 그에 속하는 법정동) =====
    '해운대구': { lat: 35.1633, lon: 129.1627, name: '부산시 해운대구', type: '기초자치단체' },
    '우1동': { lat: 35.1660, lon: 129.1350, name: '부산시 해운대구 우1동', type: '행정동', contains_legal_divisions: ['우동'] },
    '우2동': { lat: 35.1690, lon: 129.1380, name: '부산시 해운대구 우2동', type: '행정동', contains_legal_divisions: ['우동'] },
    '우3동': { lat: 35.1720, lon: 129.1410, name: '부산시 해운대구 우3동', type: '행정동', contains_legal_divisions: ['우동'] },
    '중1동': { lat: 35.1500, lon: 129.1500, name: '부산시 해운대구 중1동', type: '행정동', contains_legal_divisions: ['중동'] },
    '중2동': { lat: 35.1530, lon: 129.1530, name: '부산시 해운대구 중2동', type: '행정동', contains_legal_divisions: ['중동'] },
    '좌1동': { lat: 35.1800, lon: 129.1700, name: '부산시 해운대구 좌1동', type: '행정동', contains_legal_divisions: ['좌동'] },
    '좌2동': { lat: 35.1830, lon: 129.1730, name: '부산시 해운대구 좌2동', type: '행정동', contains_legal_divisions: ['좌동'] },
    '좌3동': { lat: 35.1860, lon: 129.1760, name: '부산시 해운대구 좌3동', type: '행정동', contains_legal_divisions: ['좌동'] },
    '좌4동': { lat: 35.1890, lon: 129.1790, name: '부산시 해운대구 좌4동', type: '행정동', contains_legal_divisions: ['좌동'] },
    '송정동': { lat: 35.1700, lon: 129.2000, name: '부산시 해운대구 송정동', type: '행정동', contains_legal_divisions: ['송정동'] },
    '반송1동': { lat: 35.2100, lon: 129.1900, name: '부산시 해운대구 반송1동', type: '행정동', contains_legal_divisions: ['반송동'] },
    '반송2동': { lat: 35.2130, lon: 129.1930, name: '부산시 해운대구 반송2동', type: '행정동', contains_legal_divisions: ['반송동'] },
    '반여1동': { lat: 35.1900, lon: 129.1300, name: '부산시 해운대구 반여1동', type: '행정동', contains_legal_divisions: ['반여동'] },
    '반여2동': { lat: 35.1930, lon: 129.1330, name: '부산시 해운대구 반여2동', type: '행정동', contains_legal_divisions: ['반여동'] },
    '반여3동': { lat: 35.1960, lon: 129.1360, name: '부산시 해운대구 반여3동', type: '행정동', contains_legal_divisions: ['반여동'] },
    '반여4동': { lat: 35.1990, lon: 129.1390, name: '부산시 해운대구 반여4동', type: '행정동', contains_legal_divisions: ['반여동'] },
    '재송1동': { lat: 35.1700, lon: 129.1100, name: '부산시 해운대구 재송1동', type: '행정동', contains_legal_divisions: ['재송동'] },
    '재송2동': { lat: 35.1730, lon: 129.1130, name: '부산시 해운대구 재송2동', type: '행정동', contains_legal_divisions: ['재송동'] },

    // 해운대구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 해운대구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 사하구 (행정동 및 그에 속하는 법정동) =====
    '사하구': { lat: 35.0994, lon: 128.9734, name: '부산시 사하구', type: '기초자치단체' },
    '괴정1동': { lat: 35.0950, lon: 128.9800, name: '부산시 사하구 괴정1동', type: '행정동', contains_legal_divisions: ['괴정동'] },
    '괴정2동': { lat: 35.0980, lon: 128.9830, name: '부산시 사하구 괴정2동', type: '행정동', contains_legal_divisions: ['괴정동'] },
    '괴정3동': { lat: 35.1010, lon: 128.9860, name: '부산시 사하구 괴정3동', type: '행정동', contains_legal_divisions: ['괴정동'] },
    '괴정4동': { lat: 35.1040, lon: 128.9890, name: '부산시 사하구 괴정4동', type: '행정동', contains_legal_divisions: ['괴정동'] },
    '당리동': { lat: 35.1100, lon: 128.9700, name: '부산시 사하구 당리동', type: '행정동', contains_legal_divisions: ['당리동'] },
    '하단1동': { lat: 35.1000, lon: 128.9600, name: '부산시 사하구 하단1동', type: '행정동', contains_legal_divisions: ['하단동'] },
    '하단2동': { lat: 35.1030, lon: 128.9630, name: '부산시 사하구 하단2동', type: '행정동', contains_legal_divisions: ['하단동'] },
    '신평1동': { lat: 35.0900, lon: 128.9600, name: '부산시 사하구 신평1동', type: '행정동', contains_legal_divisions: ['신평동'] },
    '신평2동': { lat: 35.0930, lon: 128.9630, name: '부산시 사하구 신평2동', type: '행정동', contains_legal_divisions: ['신평동'] },
    '장림1동': { lat: 35.0800, lon: 128.9500, name: '부산시 사하구 장림1동', type: '행정동', contains_legal_divisions: ['장림동'] },
    '장림2동': { lat: 35.0830, lon: 128.9530, name: '부산시 사하구 장림2동', type: '행정동', contains_legal_divisions: ['장림동'] },
    '다대1동': { lat: 35.0500, lon: 128.9700, name: '부산시 사하구 다대1동', type: '행정동', contains_legal_divisions: ['다대동'] },
    '다대2동': { lat: 35.0530, lon: 128.9730, name: '부산시 사하구 다대2동', type: '행정동', contains_legal_divisions: ['다대동'] },
    '구평동': { lat: 35.0700, lon: 128.9400, name: '부산시 사하구 구평동', type: '행정동', contains_legal_divisions: ['구평동'] },
    '감천1동': { lat: 35.0750, lon: 128.9900, name: '부산시 사하구 감천1동', type: '행정동', contains_legal_divisions: ['감천동'] },
    '감천2동': { lat: 35.0780, lon: 128.9930, name: '부산시 사하구 감천2동', type: '행정동', contains_legal_divisions: ['감천동'] },

    // 사하구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 사하구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 금정구 (행정동 및 그에 속하는 법정동) =====
    '금정구': { lat: 35.2423, lon: 129.0880, name: '부산시 금정구', type: '기초자치단체' },
    '서1동': { lat: 35.2300, lon: 129.0800, name: '부산시 금정구 서1동', type: '행정동', contains_legal_divisions: ['서동'] },
    '서2동': { lat: 35.2330, lon: 129.0830, name: '부산시 금정구 서2동', type: '행정동', contains_legal_divisions: ['서동'] },
    '서3동': { lat: 35.2360, lon: 129.0860, name: '부산시 금정구 서3동', type: '행정동', contains_legal_divisions: ['서동'] },
    '금사동': { lat: 35.2300, lon: 129.0950, name: '부산시 금정구 금사동', type: '행정동', contains_legal_divisions: ['금사동'] },
    '회동동': { lat: 35.2200, lon: 129.1000, name: '부산시 금정구 회동동', type: '행정동', contains_legal_divisions: ['회동동'] },
    '선두구동': { lat: 35.2400, lon: 129.1100, name: '부산시 금정구 선두구동', type: '행정동', contains_legal_divisions: ['선동', '두구동'] },
    '청룡노포동': { lat: 35.2700, lon: 129.1100, name: '부산시 금정구 청룡노포동', type: '행정동', contains_legal_divisions: ['청룡동', '노포동'] },
    '남산동': { lat: 35.2500, lon: 129.0900, name: '부산시 금정구 남산동', type: '행정동', contains_legal_divisions: ['남산동'] },
    '구서1동': { lat: 35.2550, lon: 129.0850, name: '부산시 금정구 구서1동', type: '행정동', contains_legal_divisions: ['구서동'] },
    '구서2동': { lat: 35.2580, lon: 129.0880, name: '부산시 금정구 구서2동', type: '행정동', contains_legal_divisions: ['구서동'] },
    '장전1동': { lat: 35.2350, lon: 129.0800, name: '부산시 금정구 장전1동', type: '행정동', contains_legal_divisions: ['장전동'] },
    '장전2동': { lat: 35.2380, lon: 129.0830, name: '부산시 금정구 장전2동', type: '행정동', contains_legal_divisions: ['장전동'] },
    '부곡1동': { lat: 35.2200, lon: 129.0900, name: '부산시 금정구 부곡1동', type: '행정동', contains_legal_divisions: ['부곡동'] },
    '부곡2동': { lat: 35.2230, lon: 129.0930, name: '부산시 금정구 부곡2동', type: '행정동', contains_legal_divisions: ['부곡동'] },
    '부곡3동': { lat: 35.2260, lon: 129.0960, name: '부산시 금정구 부곡3동', type: '행정동', contains_legal_divisions: ['부곡동'] },
    '부곡4동': { lat: 35.2290, lon: 129.0990, name: '부산시 금정구 부곡4동', type: '행정동', contains_legal_divisions: ['부곡동'] },
    '장전3동': { lat: 35.2410, lon: 129.0860, name: '부산시 금정구 장전3동', type: '행정동', contains_legal_divisions: ['장전동'] },

    // 금정구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '선동': { lat: 35.2400, lon: 129.1100, name: '부산시 선동', type: '법정동', admin_parent: '선두구동' },
    '두구동': { lat: 35.2400, lon: 129.1100, name: '부산시 두구동', type: '법정동', admin_parent: '선두구동' },
    '청룡동': { lat: 35.2700, lon: 129.1100, name: '부산시 청룡동', type: '법정동', admin_parent: '청룡노포동' },
    '노포동': { lat: 35.2700, lon: 129.1100, name: '부산시 노포동', type: '법정동', admin_parent: '청룡노포동' },


    // ===== 강서구 (행정동 및 그에 속하는 법정동) =====
    '강서구': { lat: 35.1852, lon: 128.9056, name: '부산시 강서구', type: '기초자치단체' },
    '대저1동': { lat: 35.2100, lon: 128.9300, name: '부산시 강서구 대저1동', type: '행정동', contains_legal_divisions: ['대저동', '강동동', '식만동'] },
    '대저2동': { lat: 35.2000, lon: 128.9000, name: '부산시 강서구 대저2동', type: '행정동', contains_legal_divisions: ['대저동', '강동동', '식만동'] },
    '강동동': { lat: 35.1900, lon: 128.8900, name: '부산시 강서구 강동동', type: '행정동', contains_legal_divisions: ['강동동'] },
    '명지1동': { lat: 35.0900, lon: 128.8900, name: '부산시 강서구 명지1동', type: '행정동', contains_legal_divisions: ['명지동'] },
    '명지2동': { lat: 35.0930, lon: 128.8930, name: '부산시 강서구 명지2동', type: '행정동', contains_legal_divisions: ['명지동'] },
    '가락동': { lat: 35.1800, lon: 128.9500, name: '부산시 강서구 가락동', type: '행정동', contains_legal_divisions: ['죽림동', '식만동', '봉림동', '식만동'] },
    '녹산동': { lat: 35.0900, lon: 128.8200, name: '부산시 강서구 녹산동', type: '행정동', contains_legal_divisions: ['녹산동', '송정동', '화전동', '생곡동', '구랑동', '지사동', '범방동', '미음동', '대지동', '강동동'] },
    '천가동': { lat: 35.0500, lon: 128.8600, name: '부산시 강서구 천가동', type: '행정동', contains_legal_divisions: ['대항동', '동선동', '성북동', '눌차동', '천성동'] },

    // 강서구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '대저동_강서구': { lat: 35.2100, lon: 128.9300, name: '부산시 대저동', type: '법정동', admin_parent: '대저1동' },
    '식만동_강서구': { lat: 35.2100, lon: 128.9300, name: '부산시 식만동', type: '법정동', admin_parent: '대저1동' },
    '죽림동_강서구': { lat: 35.1800, lon: 128.9500, name: '부산시 죽림동', type: '법정동', admin_parent: '가락동' },
    '봉림동_강서구': { lat: 35.1800, lon: 128.9500, name: '부산시 봉림동', type: '법정동', admin_parent: '가락동' },
    '녹산동_강서구': { lat: 35.0900, lon: 128.8200, name: '부산시 녹산동', type: '법정동', admin_parent: '녹산동' },
    '화전동_강서구': { lat: 35.0900, lon: 128.8200, name: '부산시 화전동', type: '법정동', admin_parent: '녹산동' },
    '생곡동_강서구': { lat: 35.0900, lon: 128.8200, name: '부산시 생곡동', type: '법정동', admin_parent: '녹산동' },
    '구랑동_강서구': { lat: 35.0900, lon: 128.8200, name: '부산시 구랑동', type: '법정동', admin_parent: '녹산동' },
    '지사동_강서구': { lat: 35.0900, lon: 128.8200, name: '부산시 지사동', type: '법정동', admin_parent: '녹산동' },
    '범방동_강서구': { lat: 35.0900, lon: 128.8200, name: '부산시 범방동', type: '법정동', admin_parent: '녹산동' },
    '미음동_강서구': { lat: 35.0900, lon: 128.8200, name: '부산시 미음동', type: '법정동', admin_parent: '녹산동' },
    '대지동_강서구': { lat: 35.0900, lon: 128.8200, name: '부산시 대지동', type: '법정동', admin_parent: '녹산동' },
    '대항동_강서구': { lat: 35.0500, lon: 128.8600, name: '부산시 대항동', type: '법정동', admin_parent: '천가동' },
    '동선동_강서구': { lat: 35.0500, lon: 128.8600, name: '부산시 동선동', type: '법정동', admin_parent: '천가동' },
    '성북동_강서구': { lat: 35.0500, lon: 128.8600, name: '부산시 성북동', type: '법정동', admin_parent: '천가동' },
    '눌차동_강서구': { lat: 35.0500, lon: 128.8600, name: '부산시 눌차동', type: '법정동', admin_parent: '천가동' },
    '천성동_강서구': { lat: 35.0500, lon: 128.8600, name: '부산시 천성동', type: '법정동', admin_parent: '천가동' },


    // ===== 연제구 (행정동 및 그에 속하는 법정동) =====
    '연제구': { lat: 35.1895, lon: 129.0820, name: '부산시 연제구', type: '기초자치단체' },
    '거제1동': { lat: 35.1850, lon: 129.0600, name: '부산시 연제구 거제1동', type: '행정동', contains_legal_divisions: ['거제동'] },
    '거제2동': { lat: 35.1880, lon: 129.0630, name: '부산시 연제구 거제2동', type: '행정동', contains_legal_divisions: ['거제동'] },
    '거제3동': { lat: 35.1910, lon: 129.0660, name: '부산시 연제구 거제3동', type: '행정동', contains_legal_divisions: ['거제동'] },
    '연산1동': { lat: 35.1800, lon: 129.0800, name: '부산시 연제구 연산1동', type: '행정동', contains_legal_divisions: ['연산동'] },
    '연산2동': { lat: 35.1830, lon: 129.0830, name: '부산시 연제구 연산2동', type: '행정동', contains_legal_divisions: ['연산동'] },
    '연산3동': { lat: 35.1860, lon: 129.0860, name: '부산시 연제구 연산3동', type: '행정동', contains_legal_divisions: ['연산동'] },
    '연산4동': { lat: 35.1890, lon: 129.0890, name: '부산시 연제구 연산4동', type: '행정동', contains_legal_divisions: ['연산동'] },
    '연산5동': { lat: 35.1920, lon: 129.0920, name: '부산시 연제구 연산5동', type: '행정동', contains_legal_divisions: ['연산동'] },
    '연산6동': { lat: 35.1950, lon: 129.0950, name: '부산시 연제구 연산6동', type: '행정동', contains_legal_divisions: ['연산동'] },
    '연산8동': { lat: 35.1980, lon: 129.0980, name: '부산시 연제구 연산8동', type: '행정동', contains_legal_divisions: ['연산동'] },
    '연산9동': { lat: 35.2010, lon: 129.1010, name: '부산시 연제구 연산9동', type: '행정동', contains_legal_divisions: ['연산동'] },
    '연산10동': { lat: 35.2040, lon: 129.1040, name: '부산시 연제구 연산10동', type: '행정동', contains_legal_divisions: ['연산동'] },

    // 연제구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 연제구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 수영구 (행정동 및 그에 속하는 법정동) =====
    '수영구': { lat: 35.1504, lon: 129.1121, name: '부산시 수영구', type: '기초자치단체' },
    '남천1동': { lat: 35.1400, lon: 129.1150, name: '부산시 수영구 남천1동', type: '행정동', contains_legal_divisions: ['남천동'] },
    '남천2동': { lat: 35.1430, lon: 129.1180, name: '부산시 수영구 남천2동', type: '행정동', contains_legal_divisions: ['남천동'] },
    '수영동': { lat: 35.1500, lon: 129.1100, name: '부산시 수영구 수영동', type: '행정동', contains_legal_divisions: ['수영동'] },
    '망미1동': { lat: 35.1600, lon: 129.1000, name: '부산시 수영구 망미1동', type: '행정동', contains_legal_divisions: ['망미동'] },
    '망미2동': { lat: 35.1630, lon: 129.1030, name: '부산시 수영구 망미2동', type: '행정동', contains_legal_divisions: ['망미동'] },
    '광안1동': { lat: 35.1400, lon: 129.1250, name: '부산시 수영구 광안1동', type: '행정동', contains_legal_divisions: ['광안동'] },
    '광안2동': { lat: 35.1430, lon: 129.1280, name: '부산시 수영구 광안2동', type: '행정동', contains_legal_divisions: ['광안동'] },
    '광안3동': { lat: 35.1460, lon: 129.1310, name: '부산시 수영구 광안3동', type: '행정동', contains_legal_divisions: ['광안동'] },
    '광안4동': { lat: 35.1490, lon: 129.1340, name: '부산시 수영구 광안4동', type: '행정동', contains_legal_divisions: ['광안동'] },
    '민락동': { lat: 35.1600, lon: 129.1200, name: '부산시 수영구 민락동', type: '행정동', contains_legal_divisions: ['민락동'] },

    // 수영구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 수영구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 사상구 (행정동 및 그에 속하는 법정동) =====
    '사상구': { lat: 35.1528, lon: 128.9839, name: '부산시 사상구', type: '기초자치단체' },
    '삼락동': { lat: 35.1600, lon: 128.9700, name: '부산시 사상구 삼락동', type: '행정동', contains_legal_divisions: ['삼락동'] },
    '모라1동': { lat: 35.1900, lon: 128.9800, name: '부산시 사상구 모라1동', type: '행정동', contains_legal_divisions: ['모라동'] },
    '모라3동': { lat: 35.1930, lon: 128.9830, name: '부산시 사상구 모라3동', type: '행정동', contains_legal_divisions: ['모라동'] },
    '덕포1동': { lat: 35.1650, lon: 128.9600, name: '부산시 사상구 덕포1동', type: '행정동', contains_legal_divisions: ['덕포동'] },
    '덕포2동': { lat: 35.1680, lon: 128.9630, name: '부산시 사상구 덕포2동', type: '행정동', contains_legal_divisions: ['덕포동'] },
    '괘법동': { lat: 35.1500, lon: 128.9750, name: '부산시 사상구 괘법동', type: '행정동', contains_legal_divisions: ['괘법동'] },
    '감전동': { lat: 35.1400, lon: 128.9700, name: '부산시 사상구 감전동', type: '행정동', contains_legal_divisions: ['감전동'] },
    '주례1동': { lat: 35.1500, lon: 129.0000, name: '부산시 사상구 주례1동', type: '행정동', contains_legal_divisions: ['주례동'] },
    '주례2동': { lat: 35.1530, lon: 129.0030, name: '부산시 사상구 주례2동', type: '행정동', contains_legal_divisions: ['주례동'] },
    '주례3동': { lat: 35.1560, lon: 129.0060, name: '부산시 사상구 주례3동', type: '행정동', contains_legal_divisions: ['주례동'] },
    '학장동': { lat: 35.1300, lon: 128.9800, name: '부산시 사상구 학장동', type: '행정동', contains_legal_divisions: ['학장동'] },
    '엄궁동': { lat: 35.1150, lon: 128.9700, name: '부산시 사상구 엄궁동', type: '행정동', contains_legal_divisions: ['엄궁동'] },

    // 사상구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 사상구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 기장군 (읍, 면 및 그에 속하는 법정리) =====
    '기장군': { lat: 35.2413, lon: 129.2155, name: '부산시 기장군', type: '기초자치단체' },
    '기장읍': { lat: 35.2450, lon: 129.2150, name: '부산시 기장군 기장읍', type: '읍', contains_legal_divisions: ['교리', '대라리', '동부리', '죽성리', '청강리', '고사리', '만화리', '무곡리', '서부리', '신천리', '연화리', '이천리', '죽전리', '내리', '대변리', '시랑리'] },
    '장안읍': { lat: 35.3400, lon: 129.2800, name: '부산시 기장군 장안읍', type: '읍', contains_legal_divisions: ['좌천리', '기룡리', '반룡리', '용소리', '장안리', '좌동리', '월내리'] },
    '정관읍': { lat: 35.3000, lon: 129.1700, name: '부산시 기장군 정관읍', type: '읍', contains_legal_divisions: ['매학리', '병산리', '방곡리', '달산리', '용수리', '모전리', '덕산리', '예림리', '임곡리', '정관리', '두명리', '월평리', '어방리'] },
    '일광읍': { lat: 35.2900, lon: 129.2500, name: '부산시 기장군 일광읍', type: '읍', contains_legal_divisions: ['삼성리', '학리', '동백리', '문동리', '청광리', '칠암리', '화전리', '원리', '이천리', '좌동리'] },
    '철마면': { lat: 35.2800, lon: 129.1100, name: '부산시 기장군 철마면', type: '면', contains_legal_divisions: ['송정리', '웅천리', '철마리', '연구리', '이곡리', '고촌리', '임기리', '안평리', '백길리', '장전리'] },

    // 기장군 법정리 (개별 항목 없음 - 읍/면 항목의 contains_legal_divisions에 포함)


    // ===== 인천광역시 데이터 계속 (수정 없음) =====
    '인천': { lat: 37.4563, lon: 126.7052, name: '인천시', type: '광역자치단체', aliases: ['인천광역시', '인천'] },
    '인천시': { lat: 37.4563, lon: 126.7052, name: '인천시', type: '광역자치단체', aliases: ['인천광역시', '인천'] },

    // ===== 중구 (행정동 및 그에 속하는 법정동) =====
    '중구_인천': { lat: 37.4729, lon: 126.6212, name: '인천시 중구', type: '기초자치단체' },
    '연안동': { lat: 37.4570, lon: 126.6150, name: '인천시 중구 연안동', type: '행정동', contains_legal_divisions: ['항동1가', '항동2가', '항동3가', '항동4가', '항동5가', '항동6가', '항동7가', '신흥동1가', '신흥동2가', '신흥동3가', '선화동', '유동', '송학동1가', '송학동2가', '송학동3가', '사동', '신생동', '답동', '해안동1가', '해안동2가', '해안동3가', '해안동4가', '관동1가', '관동2가', '관동3가', '중앙동1가', '중앙동2가', '중앙동3가', '중앙동4가', '인현동', '전동', '내동', '경동', '용동', '송월동1가', '송월동2가', '송월동3가', '북성동1가', '북성동2가', '북성동3가'] },
    '신포동': { lat: 37.4760, lon: 126.6260, name: '인천시 중구 신포동', type: '행정동', contains_legal_divisions: ['중앙동1가', '중앙동2가', '중앙동3가', '중앙동4가', '신포동', '내동', '경동', '사동', '신생동', '답동', '해안동1가', '해안동2가', '해안동3가', '해안동4가', '관동1가', '관동2가', '관동3가', '선화동', '유동', '송학동1가', '송학동2가', '송학동3가'] },
    '동인천동': { lat: 37.4780, lon: 126.6340, name: '인천시 중구 동인천동', type: '행정동', contains_legal_divisions: ['인현동', '전동', '내동', '경동', '용동', '중앙동1가', '중앙동2가', '중앙동3가', '중앙동4가', '사동', '신생동', '답동', '신포동'] },
    '북성동': { lat: 37.4790, lon: 126.6160, name: '인천시 중구 북성동', type: '행정동', contains_legal_divisions: ['북성동1가', '북성동2가', '북성동3가', '선린동', '송월동1가', '송월동2가', '송월동3가', '만석동', '화수동', '송림동'] },
    '송월동': { lat: 37.4800, lon: 126.6200, name: '인천시 중구 송월동', type: '행정동', contains_legal_divisions: ['송월동1가', '송월동2가', '송월동3가', '북성동1가', '북성동2가', '북성동3가'] },
    '영종동': { lat: 37.4860, lon: 126.5400, name: '인천시 중구 영종동', type: '행정동', contains_legal_divisions: ['중산동', '운남동', '운서동', '운북동'] },
    '영종1동': { lat: 37.4750, lon: 126.5800, name: '인천시 중구 영종1동', type: '행정동', contains_legal_divisions: ['운서동', '중산동'] },
    '영종2동': { lat: 37.4900, lon: 126.5600, name: '인천시 중구 영종2동', type: '행정동', contains_legal_divisions: ['운남동', '운북동'] },
    '영종3동': { lat: 37.4950, lon: 126.5200, name: '인천시 중구 영종3동', type: '행정동', contains_legal_divisions: ['영종동'] },
    '용유동': { lat: 37.4200, lon: 126.4300, name: '인천시 중구 용유동', type: '행정동', contains_legal_divisions: ['을왕동', '남북동', '덕교동', '을왕동', '무의동'] },
    '영종국제도시동': { lat: 37.4800, lon: 126.5800, name: '인천시 중구 영종국제도시동', type: '행정동', contains_legal_divisions: ['운서동', '운남동', '중산동', '운북동'] },

    // 중구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '항동1가': { lat: 37.4570, lon: 126.6150, name: '인천시 항동1가', type: '법정동', admin_parent: '연안동' },
    '항동2가': { lat: 37.4570, lon: 126.6150, name: '인천시 항동2가', type: '법정동', admin_parent: '연안동' },
    '항동3가': { lat: 37.4570, lon: 126.6150, name: '인천시 항동3가', type: '법정동', admin_parent: '연안동' },
    '항동4가': { lat: 37.4570, lon: 126.6150, name: '인천시 항동4가', type: '법정동', admin_parent: '연안동' },
    '항동5가': { lat: 37.4570, lon: 126.6150, name: '인천시 항동5가', type: '법정동', admin_parent: '연안동' },
    '항동6가': { lat: 37.4570, lon: 126.6150, name: '인천시 항동6가', type: '법정동', admin_parent: '연안동' },
    '항동7가': { lat: 37.4570, lon: 126.6150, name: '인천시 항동7가', type: '법정동', admin_parent: '연안동' },
    '신흥동1가': { lat: 37.4570, lon: 126.6150, name: '인천시 신흥동1가', type: '법정동', admin_parent: '연안동' },
    '신흥동2가': { lat: 37.4570, lon: 126.6150, name: '인천시 신흥동2가', type: '법정동', admin_parent: '연안동' },
    '신흥동3가': { lat: 37.4570, lon: 126.6150, name: '인천시 신흥동3가', type: '법정동', admin_parent: '연안동' },
    '선화동': { lat: 37.4570, lon: 126.6150, name: '인천시 선화동', type: '법정동', admin_parent: '연안동' },
    '유동': { lat: 37.4570, lon: 126.6150, name: '인천시 유동', type: '법정동', admin_parent: '연안동' },
    '송학동1가': { lat: 37.4570, lon: 126.6150, name: '인천시 송학동1가', type: '법정동', admin_parent: '연안동' },
    '송학동2가': { lat: 37.4570, lon: 126.6150, name: '인천시 송학동2가', type: '법정동', admin_parent: '연안동' },
    '송학동3가': { lat: 37.4570, lon: 126.6150, name: '인천시 송학동3가', type: '법정동', admin_parent: '연안동' },
    '중앙동1가': { lat: 37.4760, lon: 126.6260, name: '인천시 중앙동1가', type: '법정동', admin_parent: '신포동' },
    '중앙동2가': { lat: 37.4760, lon: 126.6260, name: '인천시 중앙동2가', type: '법정동', admin_parent: '신포동' },
    '중앙동3가': { lat: 37.4760, lon: 126.6260, name: '인천시 중앙동3가', type: '법정동', admin_parent: '신포동' },
    '중앙동4가': { lat: 37.4760, lon: 126.6260, name: '인천시 중앙동4가', type: '법정동', admin_parent: '신포동' },
    '내동': { lat: 37.4760, lon: 126.6260, name: '인천시 내동', type: '법정동', admin_parent: '신포동' },
    '경동': { lat: 37.4760, lon: 126.6260, name: '인천시 경동', type: '법정동', admin_parent: '신포동' },
    '사동': { lat: 37.4760, lon: 126.6260, name: '인천시 사동', type: '법정동', admin_parent: '신포동' },
    '신생동': { lat: 37.4760, lon: 126.6260, name: '인천시 신생동', type: '법정동', admin_parent: '신포동' },
    '답동': { lat: 37.4760, lon: 126.6260, name: '인천시 답동', type: '법정동', admin_parent: '신포동' },
    '해안동1가': { lat: 37.4760, lon: 126.6260, name: '인천시 해안동1가', type: '법정동', admin_parent: '신포동' },
    '해안동2가': { lat: 37.4760, lon: 126.6260, name: '인천시 해안동2가', type: '법정동', admin_parent: '신포동' },
    '해안동3가': { lat: 37.4760, lon: 126.6260, name: '인천시 해안동3가', type: '법정동', admin_parent: '신포동' },
    '해안동4가': { lat: 37.4760, lon: 126.6260, name: '인천시 해안동4가', type: '법정동', admin_parent: '신포동' },
    '관동1가': { lat: 37.4760, lon: 126.6260, name: '인천시 관동1가', type: '법정동', admin_parent: '신포동' },
    '관동2가': { lat: 37.4760, lon: 126.6260, name: '인천시 관동2가', type: '법정동', admin_parent: '신포동' },
    '관동3가': { lat: 37.4760, lon: 126.6260, name: '인천시 관동3가', type: '법정동', admin_parent: '신포동' },
    '인현동': { lat: 37.4780, lon: 126.6340, name: '인천시 인현동', type: '법정동', admin_parent: '동인천동' },
    '전동': { lat: 37.4780, lon: 126.6340, name: '인천시 전동', type: '법정동', admin_parent: '동인천동' },
    '용동': { lat: 37.4780, lon: 126.6340, name: '인천시 용동', type: '법정동', admin_parent: '동인천동' },
    '북성동1가': { lat: 37.4790, lon: 126.6160, name: '인천시 북성동1가', type: '법정동', admin_parent: '북성동' },
    '북성동2가': { lat: 37.4790, lon: 126.6160, name: '인천시 북성동2가', type: '법정동', admin_parent: '북성동' },
    '북성동3가': { lat: 37.4790, lon: 126.6160, name: '인천시 북성동3가', type: '법정동', admin_parent: '북성동' },
    '선린동': { lat: 37.4790, lon: 126.6160, name: '인천시 선린동', type: '법정동', admin_parent: '북성동' },
    '만석동': { lat: 37.4790, lon: 126.6160, name: '인천시 만석동', type: '법정동', admin_parent: '북성동' },
    '화수동': { lat: 37.4790, lon: 126.6160, name: '인천시 화수동', type: '법정동', admin_parent: '북성동' },
    '송림동': { lat: 37.4790, lon: 126.6160, name: '인천시 송림동', type: '법정동', admin_parent: '북성동' },
    '송월동1가': { lat: 37.4800, lon: 126.6200, name: '인천시 송월동1가', type: '법정동', admin_parent: '송월동' },
    '송월동2가': { lat: 37.4800, lon: 126.6200, name: '인천시 송월동2가', type: '법정동', admin_parent: '송월동' },
    '송월동3가': { lat: 37.4800, lon: 126.6200, name: '인천시 송월동3가', type: '법정동', admin_parent: '송월동' },
    '중산동': { lat: 37.4860, lon: 126.5400, name: '인천시 중산동', type: '법정동', admin_parent: '영종동' },
    '운남동': { lat: 37.4860, lon: 126.5400, name: '인천시 운남동', type: '법정동', admin_parent: '영종동' },
    '운서동': { lat: 37.4860, lon: 126.5400, name: '인천시 운서동', type: '법정동', admin_parent: '영종동' },
    '운북동': { lat: 37.4860, lon: 126.5400, name: '인천시 운북동', type: '법정동', admin_parent: '영종동' },
    '을왕동': { lat: 37.4200, lon: 126.4300, name: '인천시 을왕동', type: '법정동', admin_parent: '용유동' },
    '남북동': { lat: 37.4200, lon: 126.4300, name: '인천시 남북동', type: '법정동', admin_parent: '용유동' },
    '덕교동': { lat: 37.4200, lon: 126.4300, name: '인천시 덕교동', type: '법정동', admin_parent: '용유동' },
    '무의동': { lat: 37.4200, lon: 126.4300, name: '인천시 무의동', type: '법정동', admin_parent: '용유동' },

    // ===== 동구 (행정동 및 그에 속하는 법정동) =====
    '동구_인천': { lat: 37.4772, lon: 126.6433, name: '인천시 동구', type: '기초자치단체' },
    '만석동_동구': { lat: 37.4850, lon: 126.6150, name: '인천시 동구 만석동', type: '행정동', contains_legal_divisions: ['만석동'] },
    '화수1.2동': { lat: 37.4800, lon: 126.6300, name: '인천시 동구 화수1.2동', type: '행정동', contains_legal_divisions: ['화수동'] },
    '화평동': { lat: 37.4750, lon: 126.6350, name: '인천시 동구 화평동', type: '행정동', contains_legal_divisions: ['화평동'] },
    '송림1동': { lat: 37.4700, lon: 126.6400, name: '인천시 동구 송림1동', type: '행정동', contains_legal_divisions: ['송림동'] },
    '송림2동': { lat: 37.4720, lon: 126.6450, name: '인천시 동구 송림2동', type: '행정동', contains_legal_divisions: ['송림동'] },
    '송림3.5동': { lat: 37.4740, lon: 126.6500, name: '인천시 동구 송림3.5동', type: '행정동', contains_legal_divisions: ['송림동'] },
    '송림4동': { lat: 37.4760, lon: 126.6550, name: '인천시 동구 송림4동', type: '행정동', contains_legal_divisions: ['송림동'] },
    '금창동': { lat: 37.4650, lon: 126.6480, name: '인천시 동구 금창동', type: '행정동', contains_legal_divisions: ['금곡동', '창영동', '송림동'] },
    '송림6동': { lat: 37.4600, lon: 126.6500, name: '인천시 동구 송림6동', type: '행정동', contains_legal_divisions: ['송림동'] },

    // 동구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '금곡동': { lat: 37.4650, lon: 126.6480, name: '인천시 금곡동', type: '법정동', admin_parent: '금창동' },
    '창영동': { lat: 37.4650, lon: 126.6480, name: '인천시 창영동', type: '법정동', admin_parent: '금창동' },


    // ===== 미추홀구 (행정동 및 그에 속하는 법정동) =====
    '미추홀구_인천': { lat: 37.4614, lon: 126.6608, name: '인천시 미추홀구', type: '기초자치단체' },
    '숭의1.3동': { lat: 37.4620, lon: 126.6450, name: '인천시 미추홀구 숭의1.3동', type: '행정동', contains_legal_divisions: ['숭의동'] },
    '숭의2동': { lat: 37.4650, lon: 126.6500, name: '인천시 미추홀구 숭의2동', type: '행정동', contains_legal_divisions: ['숭의동'] },
    '숭의4동': { lat: 37.4680, lon: 126.6550, name: '인천시 미추홀구 숭의4동', type: '행정동', contains_legal_divisions: ['숭의동'] },
    '용현1.4동': { lat: 37.4450, lon: 126.6450, name: '인천시 미추홀구 용현1.4동', type: '행정동', contains_legal_divisions: ['용현동'] },
    '용현2동': { lat: 37.4400, lon: 126.6500, name: '인천시 미추홀구 용현2동', type: '행정동', contains_legal_divisions: ['용현동'] },
    '용현3동': { lat: 37.4350, lon: 126.6550, name: '인천시 미추홀구 용현3동', type: '행정동', contains_legal_divisions: ['용현동'] },
    '학익1동': { lat: 37.4300, lon: 126.6600, name: '인천시 미추홀구 학익1동', type: '행정동', contains_legal_divisions: ['학익동'] },
    '학익2동': { lat: 37.4250, lon: 126.6650, name: '인천시 미추홀구 학익2동', type: '행정동', contains_legal_divisions: ['학익동'] },
    '도화1동': { lat: 37.4600, lon: 126.6600, name: '인천시 미추홀구 도화1동', type: '행정동', contains_legal_divisions: ['도화동'] },
    '도화2.3동': { lat: 37.4550, lon: 126.6650, name: '인천시 미추홀구 도화2.3동', type: '행정동', contains_legal_divisions: ['도화동'] },
    '주안1동': { lat: 37.4500, lon: 126.6700, name: '인천시 미추홀구 주안1동', type: '행정동', contains_legal_divisions: ['주안동'] },
    '주안2동': { lat: 37.4450, lon: 126.6750, name: '인천시 미추홀구 주안2동', type: '행정동', contains_legal_divisions: ['주안동'] },
    '주안3동': { lat: 37.4400, lon: 126.6800, name: '인천시 미추홀구 주안3동', type: '행정동', contains_legal_divisions: ['주안동'] },
    '주안4동': { lat: 37.4350, lon: 126.6850, name: '인천시 미추홀구 주안4동', type: '행정동', contains_legal_divisions: ['주안동'] },
    '주안5동': { lat: 37.4300, lon: 126.6900, name: '인천시 미추홀구 주안5동', type: '행정동', contains_legal_divisions: ['주안동'] },
    '주안6동': { lat: 37.4250, lon: 126.6950, name: '인천시 미추홀구 주안6동', type: '행정동', contains_legal_divisions: ['주안동'] },
    '주안7동': { lat: 37.4200, lon: 126.7000, name: '인천시 미추홀구 주안7동', type: '행정동', contains_legal_divisions: ['주안동'] },
    '주안8동': { lat: 37.4150, lon: 126.7050, name: '인천시 미추홀구 주안8동', type: '행정동', contains_legal_divisions: ['주안동'] },
    '관교동': { lat: 37.4000, lon: 126.6900, name: '인천시 미추홀구 관교동', type: '행정동', contains_legal_divisions: ['관교동'] },
    '문학동': { lat: 37.4050, lon: 126.6750, name: '인천시 미추홀구 문학동', type: '행정동', contains_legal_divisions: ['문학동'] },

    // 미추홀구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 미추홀구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 연수구 (행정동 및 그에 속하는 법정동) =====
    '연수구_인천': { lat: 37.4093, lon: 126.6775, name: '인천시 연수구', type: '기초자치단체' },
    '옥련1동': { lat: 37.4000, lon: 126.6400, name: '인천시 연수구 옥련1동', type: '행정동', contains_legal_divisions: ['옥련동'] },
    '옥련2동': { lat: 37.3950, lon: 126.6450, name: '인천시 연수구 옥련2동', type: '행정동', contains_legal_divisions: ['옥련동'] },
    '선학동': { lat: 37.4050, lon: 126.6700, name: '인천시 연수구 선학동', type: '행정동', contains_legal_divisions: ['선학동'] },
    '연수1동': { lat: 37.4100, lon: 126.6750, name: '인천시 연수구 연수1동', type: '행정동', contains_legal_divisions: ['연수동'] },
    '연수2동': { lat: 37.4150, lon: 126.6800, name: '인천시 연수구 연수2동', type: '행정동', contains_legal_divisions: ['연수동'] },
    '연수3동': { lat: 37.4200, lon: 126.6850, name: '인천시 연수구 연수3동', type: '행정동', contains_legal_divisions: ['연수동'] },
    '청학동': { lat: 37.4000, lon: 126.6550, name: '인천시 연수구 청학동', type: '행정동', contains_legal_divisions: ['청학동'] },
    '동춘1동': { lat: 37.3900, lon: 126.6800, name: '인천시 연수구 동춘1동', type: '행정동', contains_legal_divisions: ['동춘동'] },
    '동춘2동': { lat: 37.3850, lon: 126.6850, name: '인천시 연수구 동춘2동', type: '행정동', contains_legal_divisions: ['동춘동'] },
    '동춘3동': { lat: 37.3800, lon: 126.6900, name: '인천시 연수구 동춘3동', type: '행정동', contains_legal_divisions: ['동춘동'] },
    '송도1동': { lat: 37.3800, lon: 126.6500, name: '인천시 연수구 송도1동', type: '행정동', contains_legal_divisions: ['송도동'] },
    '송도2동': { lat: 37.3750, lon: 126.6600, name: '인천시 연수구 송도2동', type: '행정동', contains_legal_divisions: ['송도동'] },
    '송도3동': { lat: 37.3700, lon: 126.6700, name: '인천시 연수구 송도3동', type: '행정동', contains_legal_divisions: ['송도동'] },
    '송도4동': { lat: 37.3650, lon: 126.6800, name: '인천시 연수구 송도4동', type: '행정동', contains_legal_divisions: ['송도동'] },
    '송도5동': { lat: 37.3600, lon: 126.6900, name: '인천시 연수구 송도5동', type: '행정동', contains_legal_divisions: ['송도동'] },

    // 연수구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 연수구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 남동구 (행정동 및 그에 속하는 법정동) =====
    '남동구_인천': { lat: 37.4046, lon: 126.7323, name: '인천시 남동구', type: '기초자치단체' },
    '구월1동': { lat: 37.4500, lon: 126.6950, name: '인천시 남동구 구월1동', type: '행정동', contains_legal_divisions: ['구월동'] },
    '구월2동': { lat: 37.4450, lon: 126.7000, name: '인천시 남동구 구월2동', type: '행정동', contains_legal_divisions: ['구월동'] },
    '구월3동': { lat: 37.4400, lon: 126.7050, name: '인천시 남동구 구월3동', type: '행정동', contains_legal_divisions: ['구월동'] },
    '구월4동': { lat: 37.4350, lon: 126.7100, name: '인천시 남동구 구월4동', type: '행정동', contains_legal_divisions: ['구월동'] },
    '간석1동': { lat: 37.4600, lon: 126.7050, name: '인천시 남동구 간석1동', type: '행정동', contains_legal_divisions: ['간석동'] },
    '간석2동': { lat: 37.4550, lon: 126.7100, name: '인천시 남동구 간석2동', type: '행정동', contains_legal_divisions: ['간석동'] },
    '간석3동': { lat: 37.4500, lon: 126.7150, name: '인천시 남동구 간석3동', type: '행정동', contains_legal_divisions: ['간석동'] },
    '간석4동': { lat: 37.4450, lon: 126.7200, name: '인천시 남동구 간석4동', type: '행정동', contains_legal_divisions: ['간석동'] },
    '만수1동': { lat: 37.4300, lon: 126.7250, name: '인천시 남동구 만수1동', type: '행정동', contains_legal_divisions: ['만수동'] },
    '만수2동': { lat: 37.4250, lon: 126.7300, name: '인천시 남동구 만수2동', type: '행정동', contains_legal_divisions: ['만수동'] },
    '만수3동': { lat: 37.4200, lon: 126.7350, name: '인천시 남동구 만수3동', type: '행정동', contains_legal_divisions: ['만수동'] },
    '만수4동': { lat: 37.4150, lon: 126.7400, name: '인천시 남동구 만수4동', type: '행정동', contains_legal_divisions: ['만수동'] },
    '만수5동': { lat: 37.4100, lon: 126.7450, name: '인천시 남동구 만수5동', type: '행정동', contains_legal_divisions: ['만수동'] },
    '만수6동': { lat: 37.4050, lon: 126.7500, name: '인천시 남동구 만수6동', type: '행정동', contains_legal_divisions: ['만수동'] },
    '장수서창동': { lat: 37.4200, lon: 126.7800, name: '인천시 남동구 장수서창동', type: '행정동', contains_legal_divisions: ['장수동', '서창동', '운연동'] },
    '남촌도림동': { lat: 37.3800, lon: 126.7500, name: '인천시 남동구 남촌도림동', type: '행정동', contains_legal_divisions: ['남촌동', '도림동', '수산동', '만수동'] },
    '논현1동': { lat: 37.3850, lon: 126.7200, name: '인천시 남동구 논현1동', type: '행정동', contains_legal_divisions: ['논현동', '고잔동'] },
    '논현2동': { lat: 37.3800, lon: 126.7150, name: '인천시 남동구 논현2동', type: '행정동', contains_legal_divisions: ['논현동', '고잔동'] },
    '논현고잔동': { lat: 37.3750, lon: 126.7100, name: '인천시 남동구 논현고잔동', type: '행정동', contains_legal_divisions: ['논현동', '고잔동'] },

    // 남동구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '장수동': { lat: 37.4200, lon: 126.7800, name: '인천시 장수동', type: '법정동', admin_parent: '장수서창동' },
    '서창동_남동구': { lat: 37.4200, lon: 126.7800, name: '인천시 서창동', type: '법정동', admin_parent: '장수서창동' },
    '운연동': { lat: 37.4200, lon: 126.7800, name: '인천시 운연동', type: '법정동', admin_parent: '장수서창동' },
    '남촌동': { lat: 37.3800, lon: 126.7500, name: '인천시 남촌동', type: '법정동', admin_parent: '남촌도림동' },
    '도림동': { lat: 37.3800, lon: 126.7500, name: '인천시 도림동', type: '법정동', admin_parent: '남촌도림동' },
    '수산동': { lat: 37.3800, lon: 126.7500, name: '인천시 수산동', type: '법정동', admin_parent: '남촌도림동' },
    '고잔동': { lat: 37.3850, lon: 126.7200, name: '인천시 고잔동', type: '법정동', admin_parent: '논현1동' },


    // ===== 부평구 (행정동 및 그에 속하는 법정동) =====
    '부평구_인천': { lat: 37.4930, lon: 126.7224, name: '인천시 부평구', type: '기초자치단체' },
    '부평1동': { lat: 37.4950, lon: 126.7200, name: '인천시 부평구 부평1동', type: '행정동', contains_legal_divisions: ['부평동'] },
    '부평2동': { lat: 37.4900, lon: 126.7250, name: '인천시 부평구 부평2동', type: '행정동', contains_legal_divisions: ['부평동'] },
    '부평3동': { lat: 37.4850, lon: 126.7300, name: '인천시 부평구 부평3동', type: '행정동', contains_legal_divisions: ['부평동'] },
    '부평4동': { lat: 37.4800, lon: 126.7350, name: '인천시 부평구 부평4동', type: '행정동', contains_legal_divisions: ['부평동'] },
    '부평5동': { lat: 37.4750, lon: 126.7400, name: '인천시 부평구 부평5동', type: '행정동', contains_legal_divisions: ['부평동'] },
    '부평6동': { lat: 37.4700, lon: 126.7450, name: '인천시 부평구 부평6동', type: '행정동', contains_legal_divisions: ['부평동'] },
    '산곡1동': { lat: 37.5000, lon: 126.7050, name: '인천시 부평구 산곡1동', type: '행정동', contains_legal_divisions: ['산곡동'] },
    '산곡2동': { lat: 37.5050, lon: 126.7100, name: '인천시 부평구 산곡2동', type: '행정동', contains_legal_divisions: ['산곡동'] },
    '산곡3동': { lat: 37.5100, lon: 126.7150, name: '인천시 부평구 산곡3동', type: '행정동', contains_legal_divisions: ['산곡동'] },
    '산곡4동': { lat: 37.5150, lon: 126.7200, name: '인천시 부평구 산곡4동', type: '행정동', contains_legal_divisions: ['산곡동'] },
    '청천1동': { lat: 37.5000, lon: 126.7300, name: '인천시 부평구 청천1동', type: '행정동', contains_legal_divisions: ['청천동'] },
    '청천2동': { lat: 37.5050, lon: 126.7350, name: '인천시 부평구 청천2동', type: '행정동', contains_legal_divisions: ['청천동'] },
    '갈산1동': { lat: 37.5100, lon: 126.7400, name: '인천시 부평구 갈산1동', type: '행정동', contains_legal_divisions: ['갈산동'] },
    '갈산2동': { lat: 37.5150, lon: 126.7450, name: '인천시 부평구 갈산2동', type: '행정동', contains_legal_divisions: ['갈산동'] },
    '삼산1동': { lat: 37.5200, lon: 126.7250, name: '인천시 부평구 삼산1동', type: '행정동', contains_legal_divisions: ['삼산동'] },
    '삼산2동': { lat: 37.5250, lon: 126.7300, name: '인천시 부평구 삼산2동', type: '행정동', contains_legal_divisions: ['삼산동'] },
    '부개1동': { lat: 37.5000, lon: 126.7500, name: '인천시 부평구 부개1동', type: '행정동', contains_legal_divisions: ['부개동'] },
    '부개2동': { lat: 37.5050, lon: 126.7550, name: '인천시 부평구 부개2동', type: '행정동', contains_legal_divisions: ['부개동'] },
    '부개3동': { lat: 37.5100, lon: 126.7600, name: '인천시 부평구 부개3동', type: '행정동', contains_legal_divisions: ['부개동'] },
    '일신동': { lat: 37.4800, lon: 126.7600, name: '인천시 부평구 일신동', type: '행정동', contains_legal_divisions: ['일신동'] },
    '십정1동': { lat: 37.4700, lon: 126.7150, name: '인천시 부평구 십정1동', type: '행정동', contains_legal_divisions: ['십정동'] },
    '십정2동': { lat: 37.4650, lon: 126.7200, name: '인천시 부평구 십정2동', type: '행정동', contains_legal_divisions: ['십정동'] },

    // 부평구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 부평구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 계양구 (행정동 및 그에 속하는 법정동) =====
    '계양구_인천': { lat: 37.5350, lon: 126.7360, name: '인천시 계양구', type: '기초자치단체' },
    '효성1동': { lat: 37.5250, lon: 126.7050, name: '인천시 계양구 효성1동', type: '행정동', contains_legal_divisions: ['효성동'] },
    '효성2동': { lat: 37.5300, lon: 126.7100, name: '인천시 계양구 효성2동', type: '행정동', contains_legal_divisions: ['효성동'] },
    '작전1동': { lat: 37.5350, lon: 126.7200, name: '인천시 계양구 작전1동', type: '행정동', contains_legal_divisions: ['작전동'] },
    '작전2동': { lat: 37.5400, lon: 126.7250, name: '인천시 계양구 작전2동', type: '행정동', contains_legal_divisions: ['작전동'] },
    '작전서운동': { lat: 37.5450, lon: 126.7300, name: '인천시 계양구 작전서운동', type: '행정동', contains_legal_divisions: ['작전동', '서운동'] },
    '계산1동': { lat: 37.5350, lon: 126.7400, name: '인천시 계양구 계산1동', type: '행정동', contains_legal_divisions: ['계산동'] },
    '계산2동': { lat: 37.5400, lon: 126.7450, name: '인천시 계양구 계산2동', type: '행정동', contains_legal_divisions: ['계산동'] },
    '계산3동': { lat: 37.5450, lon: 126.7500, name: '인천시 계양구 계산3동', type: '행정동', contains_legal_divisions: ['계산동'] },
    '계산4동': { lat: 37.5500, lon: 126.7550, name: '인천시 계양구 계산4동', type: '행정동', contains_legal_divisions: ['계산동'] },
    '계양동': { lat: 37.5600, lon: 126.7400, name: '인천시 계양구 계양동', type: '행정동', contains_legal_divisions: ['갈현동', '상야동', '하야동', '평동', '장기동', '이화동', '둑실동', '목상동', '다남동', '선주지동', '오류동'] },
    '임학동': { lat: 37.5500, lon: 126.7300, name: '인천시 계양구 임학동', type: '행정동', contains_legal_divisions: ['임학동'] },
    '병방동': { lat: 37.5550, lon: 126.7350, name: '인천시 계양구 병방동', type: '행정동', contains_legal_divisions: ['병방동'] },
    '박촌동': { lat: 37.5600, lon: 126.7400, name: '인천시 계양구 박촌동', type: '행정동', contains_legal_divisions: ['박촌동'] },
    '동양동': { lat: 37.5650, lon: 126.7450, name: '인천시 계양구 동양동', type: '행정동', contains_legal_divisions: ['동양동', '귤현동', '상야동', '하야동'] },

    // 계양구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '서운동': { lat: 37.5450, lon: 126.7300, name: '인천시 서운동', type: '법정동', admin_parent: '작전서운동' },
    '갈현동_계양구': { lat: 37.5600, lon: 126.7400, name: '인천시 갈현동', type: '법정동', admin_parent: '계양동' },
    '상야동': { lat: 37.5600, lon: 126.7400, name: '인천시 상야동', type: '법정동', admin_parent: '계양동' },
    '하야동': { lat: 37.5600, lon: 126.7400, name: '인천시 하야동', type: '법정동', admin_parent: '계양동' },
    '평동_계양구': { lat: 37.5600, lon: 126.7400, name: '인천시 평동', type: '법정동', admin_parent: '계양동' },
    '장기동_계양구': { lat: 37.5600, lon: 126.7400, name: '인천시 장기동', type: '법정동', admin_parent: '계양동' },
    '이화동': { lat: 37.5600, lon: 126.7400, name: '인천시 이화동', type: '법정동', admin_parent: '계양동' },
    '둑실동': { lat: 37.5600, lon: 126.7400, name: '인천시 둑실동', type: '법정동', admin_parent: '계양동' },
    '목상동_계양구': { lat: 37.5600, lon: 126.7400, name: '인천시 목상동', type: '법정동', admin_parent: '계양동' },
    '다남동': { lat: 37.5600, lon: 126.7400, name: '인천시 다남동', type: '법정동', admin_parent: '계양동' },
    '선주지동': { lat: 37.5600, lon: 126.7400, name: '인천시 선주지동', type: '법정동', admin_parent: '계양동' },
    '오류동_계양구': { lat: 37.5600, lon: 126.7400, name: '인천시 오류동', type: '법정동', admin_parent: '계양동' },
    '귤현동': { lat: 37.5650, lon: 126.7450, name: '인천시 귤현동', type: '법정동', admin_parent: '동양동' },


    // ===== 서구 (행정동 및 그에 속하는 법정동) =====
    '서구_인천': { lat: 37.5517, lon: 126.6669, name: '인천시 서구', type: '기초자치단체' },
    '검단동_인천': { lat: 37.5800, lon: 126.7000, name: '인천시 서구 검단동', type: '행정동', contains_legal_divisions: ['마전동', '당하동', '원당동', '불로동', '대곡동', '금곡동', '오류동', '왕길동', '백석동', '시천동', '검암동'] },
    '검단1동': { lat: 37.6000, lon: 126.6800, name: '인천시 서구 검단1동', type: '행정동', contains_legal_divisions: ['마전동', '당하동'] },
    '검단2동': { lat: 37.5950, lon: 126.6900, name: '인천시 서구 검단2동', type: '행정동', contains_legal_divisions: ['원당동', '불로동'] },
    '검단3동': { lat: 37.5900, lon: 126.7000, name: '인천시 서구 검단3동', type: '행정동', contains_legal_divisions: ['대곡동', '금곡동'] },
    '검단4동': { lat: 37.5850, lon: 126.7100, name: '인천시 서구 검단4동', type: '행정동', contains_legal_divisions: ['오류동', '왕길동'] },
    '검단5동': { lat: 37.5800, lon: 126.7200, name: '인천시 서구 검단5동', type: '행정동', contains_legal_divisions: ['백석동', '시천동'] },
    '검암경서동': { lat: 37.5700, lon: 126.6600, name: '인천시 서구 검암경서동', type: '행정동', contains_legal_divisions: ['검암동', '경서동'] },
    '연희동': { lat: 37.5600, lon: 126.6500, name: '인천시 서구 연희동', type: '행정동', contains_legal_divisions: ['연희동', '심곡동', '가정동', '공촌동', '경서동'] },
    '신현원창동': { lat: 37.5300, lon: 126.6400, name: '인천시 서구 신현원창동', type: '행정동', contains_legal_divisions: ['신현동', '원창동', '연희동'] },
    '가정1동': { lat: 37.5400, lon: 126.6700, name: '인천시 서구 가정1동', type: '행정동', contains_legal_divisions: ['가정동'] },
    '가정2동': { lat: 37.5450, lon: 126.6750, name: '인천시 서구 가정2동', type: '행정동', contains_legal_divisions: ['가정동'] },
    '가정3동': { lat: 37.5500, lon: 126.6800, name: '인천시 서구 가정3동', type: '행정동', contains_legal_divisions: ['가정동'] },
    '석남1동': { lat: 37.5100, lon: 126.6500, name: '인천시 서구 석남1동', type: '행정동', contains_legal_divisions: ['석남동'] },
    '석남2동': { lat: 37.5150, lon: 126.6550, name: '인천시 서구 석남2동', type: '행정동', contains_legal_divisions: ['석남동'] },
    '석남3동': { lat: 37.5200, lon: 126.6600, name: '인천시 서구 석남3동', type: '행정동', contains_legal_divisions: ['석남동'] },
    '가좌1동': { lat: 37.5000, lon: 126.6600, name: '인천시 서구 가좌1동', type: '행정동', contains_legal_divisions: ['가좌동'] },
    '가좌2동': { lat: 37.5050, lon: 126.6650, name: '인천시 서구 가좌2동', type: '행정동', contains_legal_divisions: ['가좌동'] },
    '가좌3동': { lat: 37.5100, lon: 126.6700, name: '인천시 서구 가좌3동', type: '행정동', contains_legal_divisions: ['가좌동'] },
    '가좌4동': { lat: 37.5150, lon: 126.6750, name: '인천시 서구 가좌4동', type: '행정동', contains_legal_divisions: ['가좌동'] },
    '청라1동': { lat: 37.5300, lon: 126.6500, name: '인천시 서구 청라1동', type: '행정동', contains_legal_divisions: ['청라동'] },
    '청라2동': { lat: 37.5350, lon: 126.6550, name: '인천시 서구 청라2동', type: '행정동', contains_legal_divisions: ['청라동'] },
    '청라3동': { lat: 37.5400, lon: 126.6600, name: '인천시 서구 청라3동', type: '행정동', contains_legal_divisions: ['청라동'] },
    '루원시티동': { lat: 37.5500, lon: 126.6700, name: '인천시 서구 루원시티동', type: '행정동', contains_legal_divisions: ['가정동'] },

    // 서구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '마전동': { lat: 37.5800, lon: 126.7000, name: '인천시 마전동', type: '법정동', admin_parent: '검단1동' },
    '당하동': { lat: 37.5800, lon: 126.7000, name: '인천시 당하동', type: '법정동', admin_parent: '검단1동' },
    '원당동': { lat: 37.5950, lon: 126.6900, name: '인천시 원당동', type: '법정동', admin_parent: '검단2동' },
    '불로동_인천': { lat: 37.5950, lon: 126.6900, name: '인천시 불로동', type: '법정동', admin_parent: '검단2동' },
    '대곡동_인천': { lat: 37.5900, lon: 126.7000, name: '인천시 대곡동', type: '법정동', admin_parent: '검단3동' },
    '금곡동_인천': { lat: 37.5900, lon: 126.7000, name: '인천시 금곡동', type: '법정동', admin_parent: '검단3동' },
    '오류동_인천': { lat: 37.5850, lon: 126.7100, name: '인천시 오류동', type: '법정동', admin_parent: '검단4동' },
    '왕길동': { lat: 37.5850, lon: 126.7100, name: '인천시 왕길동', type: '법정동', admin_parent: '검단4동' },
    '백석동': { lat: 37.5800, lon: 126.7200, name: '인천시 백석동', type: '법정동', admin_parent: '검단5동' },
    '시천동': { lat: 37.5800, lon: 126.7200, name: '인천시 시천동', type: '법정동', admin_parent: '검단5동' },
    '검암동': { lat: 37.5700, lon: 126.6600, name: '인천시 검암동', type: '법정동', admin_parent: '검암경서동' },
    '경서동': { lat: 37.5700, lon: 126.6600, name: '인천시 경서동', type: '법정동', admin_parent: '검암경서동' },
    '심곡동_인천': { lat: 37.5600, lon: 126.6500, name: '인천시 심곡동', type: '법정동', admin_parent: '연희동' },
    '가정동_인천': { lat: 37.5400, lon: 126.6700, name: '인천시 가정동', type: '법정동', admin_parent: '가정1동' },
    '공촌동': { lat: 37.5600, lon: 126.6500, name: '인천시 공촌동', type: '법정동', admin_parent: '연희동' },
    '신현동': { lat: 37.5300, lon: 126.6400, name: '인천시 신현동', type: '법정동', admin_parent: '신현원창동' },
    '원창동': { lat: 37.5300, lon: 126.6400, name: '인천시 원창동', type: '법정동', admin_parent: '신현원창동' },
    '청라동': { lat: 37.5300, lon: 126.6500, name: '인천시 청라동', type: '법정동', admin_parent: '청라1동' },


    // ===== 강화군 (읍, 면 및 그에 속하는 법정리) =====
    '강화군': { lat: 37.7479, lon: 126.4172, name: '인천시 강화군', type: '기초자치단체' },
    '강화읍': { lat: 37.7470, lon: 126.4800, name: '인천시 강화군 강화읍', type: '읍', contains_legal_divisions: ['관청리', '국화리', '남산리', '대산리', '갑곳리', '신문리', '용정리', '옥림리', '월곳리', '점량리'] },
    '길상면': { lat: 37.6000, lon: 126.4800, name: '인천시 강화군 길상면', type: '면', contains_legal_divisions: ['온수리', '길직리', '동검리', '장흥리', '선두리', '초지리'] },
    '불은면': { lat: 37.6500, lon: 126.4800, name: '인천시 강화군 불은면', type: '면', contains_legal_divisions: ['삼성리', '덕성리', '두운리', '신현리', '고능리', '오두리'] },
    '초지면': { lat: 37.6200, lon: 126.4900, name: '인천시 강화군 초지면', type: '면', contains_legal_divisions: ['초지리', '동막리'] },
    '선원면': { lat: 37.7200, lon: 126.4500, name: '인천시 강화군 선원면', type: '면', contains_legal_divisions: ['창리', '지산리', '연리', '신정리', '냉정리', '금월리'] },
    '양도면': { lat: 37.6000, lon: 126.3500, name: '인천시 강화군 양도면', type: '면', contains_legal_divisions: ['하일이', '상일이', '조산리', '능내리', '도장리', '인산리', '대흥리'] },
    '하점면': { lat: 37.7800, lon: 126.3800, name: '인천시 강화군 하점면', type: '면', contains_legal_divisions: ['이강리', '삼거리', '신봉리', '창후리', '장정리'] },
    '양사면': { lat: 37.7900, lon: 126.3400, name: '인천시 강화군 양사면', type: '면', contains_legal_divisions: ['교산리', '덕하리', '북성리', '인화리', '철산리'] },
    '송해면': { lat: 37.7700, lon: 126.4000, name: '인천시 강화군 송해면', type: '면', contains_legal_divisions: ['숭뢰리', '하도리', '당산리', '상도리', '신당리', '솔정리', '오류리'] },
    '교동면': { lat: 37.8200, lon: 126.2900, name: '인천시 강화군 교동면', type: '면', contains_legal_divisions: ['대룡리', '상룡리', '읍내리', '지석리', '동산리', '고구리', '봉소리'] },
    '삼산면': { lat: 37.7500, lon: 126.2500, name: '인천시 강화군 삼산면', type: '면', contains_legal_divisions: ['매음리', '석모리', '상리', '하리', '미법리', '서검리', '동검리'] },
    '서도면': { lat: 37.7000, lon: 126.1700, name: '인천시 강화군 서도면', type: '면', contains_legal_divisions: ['볼음리', '주문리', '아차리'] },


    // ===== 옹진군 (읍, 면 및 그에 속하는 법정리) =====
    '옹진군': { lat: 37.3800, lon: 126.3000, name: '인천시 옹진군', type: '기초자치단체' },
    '북도면': { lat: 37.4700, lon: 126.3300, name: '인천시 옹진군 북도면', type: '면', contains_legal_divisions: ['장봉리', '모도리', '시도리', '신도리'] },
    '연평면': { lat: 37.6600, lon: 125.7000, name: '인천시 옹진군 연평면', type: '면', contains_legal_divisions: ['연평리'] },
    '백령면': { lat: 37.9500, lon: 124.7000, name: '인천시 옹진군 백령면', type: '면', contains_legal_divisions: ['진촌리', '남포리', '연화리', '까치울리', '두무진리'] },
    '대청면': { lat: 37.8500, lon: 124.7500, name: '인천시 옹진군 대청면', type: '면', contains_legal_divisions: ['대청리', '소청리'] },
    '덕적면': { lat: 37.2200, lon: 126.1500, name: '인천시 옹진군 덕적면', type: '면', contains_legal_divisions: ['진리', '북리', '서포리', '울도리', '소야리', '문갑리', '굴업리', '백아리'] },
    '자월면': { lat: 37.2500, lon: 126.3500, name: '인천시 옹진군 자월면', type: '면', contains_legal_divisions: ['자월리', '이작리', '승봉리', '대부리'] },
    '영흥면': { lat: 37.2500, lon: 126.4300, name: '인천시 옹진군 영흥면', type: '면', contains_legal_divisions: ['내리', '외리', '선재리'] },
  


  
  // ===== 인천광역시 데이터 시작 =====
    '인천': { lat: 37.4563, lon: 126.7052, name: '인천시', type: '광역자치단체', aliases: ['인천광역시', '인천'] },
    '인천시': { lat: 37.4563, lon: 126.7052, name: '인천시', type: '광역자치단체', aliases: ['인천광역시', '인천'] },

    // ===== 중구 (행정동 및 그에 속하는 법정동) =====
    '중구_인천': { lat: 37.4729, lon: 126.6212, name: '인천시 중구', type: '기초자치단체' },
    '연안동': { lat: 37.4570, lon: 126.6150, name: '인천시 중구 연안동', type: '행정동', contains_legal_divisions: ['항동1가', '항동2가', '항동3가', '항동4가', '항동5가', '항동6가', '항동7가', '신흥동1가', '신흥동2가', '신흥동3가', '선화동', '유동', '송학동1가', '송학동2가', '송학동3가', '사동', '신생동', '답동', '해안동1가', '해안동2가', '해안동3가', '해안동4가', '관동1가', '관동2가', '관동3가', '중앙동1가', '중앙동2가', '중앙동3가', '중앙동4가', '인현동', '전동', '내동', '경동', '용동', '송월동1가', '송월동2가', '송월동3가', '북성동1가', '북성동2가', '북성동3가'] },
    '신포동': { lat: 37.4760, lon: 126.6260, name: '인천시 중구 신포동', type: '행정동', contains_legal_divisions: ['중앙동1가', '중앙동2가', '중앙동3가', '중앙동4가', '신포동', '내동', '경동', '사동', '신생동', '답동', '해안동1가', '해안동2가', '해안동3가', '해안동4가', '관동1가', '관동2가', '관동3가', '선화동', '유동', '송학동1가', '송학동2가', '송학동3가'] },
    '동인천동': { lat: 37.4780, lon: 126.6340, name: '인천시 중구 동인천동', type: '행정동', contains_legal_divisions: ['인현동', '전동', '내동', '경동', '용동', '중앙동1가', '중앙동2가', '중앙동3가', '중앙동4가', '사동', '신생동', '답동', '신포동'] },
    '북성동': { lat: 37.4790, lon: 126.6160, name: '인천시 중구 북성동', type: '행정동', contains_legal_divisions: ['북성동1가', '북성동2가', '북성동3가', '선린동', '송월동1가', '송월동2가', '송월동3가', '만석동', '화수동', '송림동'] },
    '송월동': { lat: 37.4800, lon: 126.6200, name: '인천시 중구 송월동', type: '행정동', contains_legal_divisions: ['송월동1가', '송월동2가', '송월동3가', '북성동1가', '북성동2가', '북성동3가'] },
    '영종동': { lat: 37.4860, lon: 126.5400, name: '인천시 중구 영종동', type: '행정동', contains_legal_divisions: ['중산동', '운남동', '운서동', '운북동'] },
    '영종1동': { lat: 37.4750, lon: 126.5800, name: '인천시 중구 영종1동', type: '행정동', contains_legal_divisions: ['운서동', '중산동'] },
    '영종2동': { lat: 37.4900, lon: 126.5600, name: '인천시 중구 영종2동', type: '행정동', contains_legal_divisions: ['운남동', '운북동'] },
    '영종3동': { lat: 37.4950, lon: 126.5200, name: '인천시 중구 영종3동', type: '행정동', contains_legal_divisions: ['영종동'] },
    '용유동': { lat: 37.4200, lon: 126.4300, name: '인천시 중구 용유동', type: '행정동', contains_legal_divisions: ['을왕동', '남북동', '덕교동', '을왕동', '무의동'] },
    '영종국제도시동': { lat: 37.4800, lon: 126.5800, name: '인천시 중구 영종국제도시동', type: '행정동', contains_legal_divisions: ['운서동', '운남동', '중산동', '운북동'] },

    // 중구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '항동1가': { lat: 37.4570, lon: 126.6150, name: '인천시 항동1가', type: '법정동', admin_parent: '연안동' },
    '항동2가': { lat: 37.4570, lon: 126.6150, name: '인천시 항동2가', type: '법정동', admin_parent: '연안동' },
    '항동3가': { lat: 37.4570, lon: 126.6150, name: '인천시 항동3가', type: '법정동', admin_parent: '연안동' },
    '항동4가': { lat: 37.4570, lon: 126.6150, name: '인천시 항동4가', type: '법정동', admin_parent: '연안동' },
    '항동5가': { lat: 37.4570, lon: 126.6150, name: '인천시 항동5가', type: '법정동', admin_parent: '연안동' },
    '항동6가': { lat: 37.4570, lon: 126.6150, name: '인천시 항동6가', type: '법정동', admin_parent: '연안동' },
    '항동7가': { lat: 37.4570, lon: 126.6150, name: '인천시 항동7가', type: '법정동', admin_parent: '연안동' },
    '신흥동1가': { lat: 37.4570, lon: 126.6150, name: '인천시 신흥동1가', type: '법정동', admin_parent: '연안동' },
    '신흥동2가': { lat: 37.4570, lon: 126.6150, name: '인천시 신흥동2가', type: '법정동', admin_parent: '연안동' },
    '신흥동3가': { lat: 37.4570, lon: 126.6150, name: '인천시 신흥동3가', type: '법정동', admin_parent: '연안동' },
    '선화동': { lat: 37.4570, lon: 126.6150, name: '인천시 선화동', type: '법정동', admin_parent: '연안동' },
    '유동': { lat: 37.4570, lon: 126.6150, name: '인천시 유동', type: '법정동', admin_parent: '연안동' },
    '송학동1가': { lat: 37.4570, lon: 126.6150, name: '인천시 송학동1가', type: '법정동', admin_parent: '연안동' },
    '송학동2가': { lat: 37.4570, lon: 126.6150, name: '인천시 송학동2가', type: '법정동', admin_parent: '연안동' },
    '송학동3가': { lat: 37.4570, lon: 126.6150, name: '인천시 송학동3가', type: '법정동', admin_parent: '연안동' },
    '중앙동1가': { lat: 37.4760, lon: 126.6260, name: '인천시 중앙동1가', type: '법정동', admin_parent: '신포동' },
    '중앙동2가': { lat: 37.4760, lon: 126.6260, name: '인천시 중앙동2가', type: '법정동', admin_parent: '신포동' },
    '중앙동3가': { lat: 37.4760, lon: 126.6260, name: '인천시 중앙동3가', type: '법정동', admin_parent: '신포동' },
    '중앙동4가': { lat: 37.4760, lon: 126.6260, name: '인천시 중앙동4가', type: '법정동', admin_parent: '신포동' },
    '내동': { lat: 37.4760, lon: 126.6260, name: '인천시 내동', type: '법정동', admin_parent: '신포동' },
    '경동': { lat: 37.4760, lon: 126.6260, name: '인천시 경동', type: '법정동', admin_parent: '신포동' },
    '사동': { lat: 37.4760, lon: 126.6260, name: '인천시 사동', type: '법정동', admin_parent: '신포동' },
    '신생동': { lat: 37.4760, lon: 126.6260, name: '인천시 신생동', type: '법정동', admin_parent: '신포동' },
    '답동': { lat: 37.4760, lon: 126.6260, name: '인천시 답동', type: '법정동', admin_parent: '신포동' },
    '해안동1가': { lat: 37.4760, lon: 126.6260, name: '인천시 해안동1가', type: '법정동', admin_parent: '신포동' },
    '해안동2가': { lat: 37.4760, lon: 126.6260, name: '인천시 해안동2가', type: '법정동', admin_parent: '신포동' },
    '해안동3가': { lat: 37.4760, lon: 126.6260, name: '인천시 해안동3가', type: '법정동', admin_parent: '신포동' },
    '해안동4가': { lat: 37.4760, lon: 126.6260, name: '인천시 해안동4가', type: '법정동', admin_parent: '신포동' },
    '관동1가': { lat: 37.4760, lon: 126.6260, name: '인천시 관동1가', type: '법정동', admin_parent: '신포동' },
    '관동2가': { lat: 37.4760, lon: 126.6260, name: '인천시 관동2가', type: '법정동', admin_parent: '신포동' },
    '관동3가': { lat: 37.4760, lon: 126.6260, name: '인천시 관동3가', type: '법정동', admin_parent: '신포동' },
    '인현동': { lat: 37.4780, lon: 126.6340, name: '인천시 인현동', type: '법정동', admin_parent: '동인천동' },
    '전동': { lat: 37.4780, lon: 126.6340, name: '인천시 전동', type: '법정동', admin_parent: '동인천동' },
    '용동': { lat: 37.4780, lon: 126.6340, name: '인천시 용동', type: '법정동', admin_parent: '동인천동' },
    '북성동1가': { lat: 37.4790, lon: 126.6160, name: '인천시 북성동1가', type: '법정동', admin_parent: '북성동' },
    '북성동2가': { lat: 37.4790, lon: 126.6160, name: '인천시 북성동2가', type: '법정동', admin_parent: '북성동' },
    '북성동3가': { lat: 37.4790, lon: 126.6160, name: '인천시 북성동3가', type: '법정동', admin_parent: '북성동' },
    '선린동': { lat: 37.4790, lon: 126.6160, name: '인천시 선린동', type: '법정동', admin_parent: '북성동' },
    '만석동': { lat: 37.4790, lon: 126.6160, name: '인천시 만석동', type: '법정동', admin_parent: '북성동' },
    '화수동': { lat: 37.4790, lon: 126.6160, name: '인천시 화수동', type: '법정동', admin_parent: '북성동' },
    '송림동': { lat: 37.4790, lon: 126.6160, name: '인천시 송림동', type: '법정동', admin_parent: '북성동' },
    '송월동1가': { lat: 37.4800, lon: 126.6200, name: '인천시 송월동1가', type: '법정동', admin_parent: '송월동' },
    '송월동2가': { lat: 37.4800, lon: 126.6200, name: '인천시 송월동2가', type: '법정동', admin_parent: '송월동' },
    '송월동3가': { lat: 37.4800, lon: 126.6200, name: '인천시 송월동3가', type: '법정동', admin_parent: '송월동' },
    '중산동': { lat: 37.4860, lon: 126.5400, name: '인천시 중산동', type: '법정동', admin_parent: '영종동' },
    '운남동': { lat: 37.4860, lon: 126.5400, name: '인천시 운남동', type: '법정동', admin_parent: '영종동' },
    '운서동': { lat: 37.4860, lon: 126.5400, name: '인천시 운서동', type: '법정동', admin_parent: '영종동' },
    '운북동': { lat: 37.4860, lon: 126.5400, name: '인천시 운북동', type: '법정동', admin_parent: '영종동' },
    '을왕동': { lat: 37.4200, lon: 126.4300, name: '인천시 을왕동', type: '법정동', admin_parent: '용유동' },
    '남북동': { lat: 37.4200, lon: 126.4300, name: '인천시 남북동', type: '법정동', admin_parent: '용유동' },
    '덕교동': { lat: 37.4200, lon: 126.4300, name: '인천시 덕교동', type: '법정동', admin_parent: '용유동' },
    '무의동': { lat: 37.4200, lon: 126.4300, name: '인천시 무의동', type: '법정동', admin_parent: '용유동' },

    // ===== 동구 (행정동 및 그에 속하는 법정동) =====
    '동구_인천': { lat: 37.4772, lon: 126.6433, name: '인천시 동구', type: '기초자치단체' },
    '만석동_동구': { lat: 37.4850, lon: 126.6150, name: '인천시 동구 만석동', type: '행정동', contains_legal_divisions: ['만석동'] },
    '화수1.2동': { lat: 37.4800, lon: 126.6300, name: '인천시 동구 화수1.2동', type: '행정동', contains_legal_divisions: ['화수동'] },
    '화평동': { lat: 37.4750, lon: 126.6350, name: '인천시 동구 화평동', type: '행정동', contains_legal_divisions: ['화평동'] },
    '송림1동': { lat: 37.4700, lon: 126.6400, name: '인천시 동구 송림1동', type: '행정동', contains_legal_divisions: ['송림동'] },
    '송림2동': { lat: 37.4720, lon: 126.6450, name: '인천시 동구 송림2동', type: '행정동', contains_legal_divisions: ['송림동'] },
    '송림3.5동': { lat: 37.4740, lon: 126.6500, name: '인천시 동구 송림3.5동', type: '행정동', contains_legal_divisions: ['송림동'] },
    '송림4동': { lat: 37.4760, lon: 126.6550, name: '인천시 동구 송림4동', type: '행정동', contains_legal_divisions: ['송림동'] },
    '금창동': { lat: 37.4650, lon: 126.6480, name: '인천시 동구 금창동', type: '행정동', contains_legal_divisions: ['금곡동', '창영동', '송림동'] },
    '송림6동': { lat: 37.4600, lon: 126.6500, name: '인천시 동구 송림6동', type: '행정동', contains_legal_divisions: ['송림동'] },

    // 동구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '금곡동': { lat: 37.4650, lon: 126.6480, name: '인천시 금곡동', type: '법정동', admin_parent: '금창동' },
    '창영동': { lat: 37.4650, lon: 126.6480, name: '인천시 창영동', type: '법정동', admin_parent: '금창동' },


    // ===== 미추홀구 (행정동 및 그에 속하는 법정동) =====
    '미추홀구_인천': { lat: 37.4614, lon: 126.6608, name: '인천시 미추홀구', type: '기초자치단체' },
    '숭의1.3동': { lat: 37.4620, lon: 126.6450, name: '인천시 미추홀구 숭의1.3동', type: '행정동', contains_legal_divisions: ['숭의동'] },
    '숭의2동': { lat: 37.4650, lon: 126.6500, name: '인천시 미추홀구 숭의2동', type: '행정동', contains_legal_divisions: ['숭의동'] },
    '숭의4동': { lat: 37.4680, lon: 126.6550, name: '인천시 미추홀구 숭의4동', type: '행정동', contains_legal_divisions: ['숭의동'] },
    '용현1.4동': { lat: 37.4450, lon: 126.6450, name: '인천시 미추홀구 용현1.4동', type: '행정동', contains_legal_divisions: ['용현동'] },
    '용현2동': { lat: 37.4400, lon: 126.6500, name: '인천시 미추홀구 용현2동', type: '행정동', contains_legal_divisions: ['용현동'] },
    '용현3동': { lat: 37.4350, lon: 126.6550, name: '인천시 미추홀구 용현3동', type: '행정동', contains_legal_divisions: ['용현동'] },
    '학익1동': { lat: 37.4300, lon: 126.6600, name: '인천시 미추홀구 학익1동', type: '행정동', contains_legal_divisions: ['학익동'] },
    '학익2동': { lat: 37.4250, lon: 126.6650, name: '인천시 미추홀구 학익2동', type: '행정동', contains_legal_divisions: ['학익동'] },
    '도화1동': { lat: 37.4600, lon: 126.6600, name: '인천시 미추홀구 도화1동', type: '행정동', contains_legal_divisions: ['도화동'] },
    '도화2.3동': { lat: 37.4550, lon: 126.6650, name: '인천시 미추홀구 도화2.3동', type: '행정동', contains_legal_divisions: ['도화동'] },
    '주안1동': { lat: 37.4500, lon: 126.6700, name: '인천시 미추홀구 주안1동', type: '행정동', contains_legal_divisions: ['주안동'] },
    '주안2동': { lat: 37.4450, lon: 126.6750, name: '인천시 미추홀구 주안2동', type: '행정동', contains_legal_divisions: ['주안동'] },
    '주안3동': { lat: 37.4400, lon: 126.6800, name: '인천시 미추홀구 주안3동', type: '행정동', contains_legal_divisions: ['주안동'] },
    '주안4동': { lat: 37.4350, lon: 126.6850, name: '인천시 미추홀구 주안4동', type: '행정동', contains_legal_divisions: ['주안동'] },
    '주안5동': { lat: 37.4300, lon: 126.6900, name: '인천시 미추홀구 주안5동', type: '행정동', contains_legal_divisions: ['주안동'] },
    '주안6동': { lat: 37.4250, lon: 126.6950, name: '인천시 미추홀구 주안6동', type: '행정동', contains_legal_divisions: ['주안동'] },
    '주안7동': { lat: 37.4200, lon: 126.7000, name: '인천시 미추홀구 주안7동', type: '행정동', contains_legal_divisions: ['주안동'] },
    '주안8동': { lat: 37.4150, lon: 126.7050, name: '인천시 미추홀구 주안8동', type: '행정동', contains_legal_divisions: ['주안동'] },
    '관교동': { lat: 37.4000, lon: 126.6900, name: '인천시 미추홀구 관교동', type: '행정동', contains_legal_divisions: ['관교동'] },
    '문학동': { lat: 37.4050, lon: 126.6750, name: '인천시 미추홀구 문학동', type: '행정동', contains_legal_divisions: ['문학동'] },

    // 미추홀구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 미추홀구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 연수구 (행정동 및 그에 속하는 법정동) =====
    '연수구_인천': { lat: 37.4093, lon: 126.6775, name: '인천시 연수구', type: '기초자치단체' },
    '옥련1동': { lat: 37.4000, lon: 126.6400, name: '인천시 연수구 옥련1동', type: '행정동', contains_legal_divisions: ['옥련동'] },
    '옥련2동': { lat: 37.3950, lon: 126.6450, name: '인천시 연수구 옥련2동', type: '행정동', contains_legal_divisions: ['옥련동'] },
    '선학동': { lat: 37.4050, lon: 126.6700, name: '인천시 연수구 선학동', type: '행정동', contains_legal_divisions: ['선학동'] },
    '연수1동': { lat: 37.4100, lon: 126.6750, name: '인천시 연수구 연수1동', type: '행정동', contains_legal_divisions: ['연수동'] },
    '연수2동': { lat: 37.4150, lon: 126.6800, name: '인천시 연수구 연수2동', type: '행정동', contains_legal_divisions: ['연수동'] },
    '연수3동': { lat: 37.4200, lon: 126.6850, name: '인천시 연수구 연수3동', type: '행정동', contains_legal_divisions: ['연수동'] },
    '청학동': { lat: 37.4000, lon: 126.6550, name: '인천시 연수구 청학동', type: '행정동', contains_legal_divisions: ['청학동'] },
    '동춘1동': { lat: 37.3900, lon: 126.6800, name: '인천시 연수구 동춘1동', type: '행정동', contains_legal_divisions: ['동춘동'] },
    '동춘2동': { lat: 37.3850, lon: 126.6850, name: '인천시 연수구 동춘2동', type: '행정동', contains_legal_divisions: ['동춘동'] },
    '동춘3동': { lat: 37.3800, lon: 126.6900, name: '인천시 연수구 동춘3동', type: '행정동', contains_legal_divisions: ['동춘동'] },
    '송도1동': { lat: 37.3800, lon: 126.6500, name: '인천시 연수구 송도1동', type: '행정동', contains_legal_divisions: ['송도동'] },
    '송도2동': { lat: 37.3750, lon: 126.6600, name: '인천시 연수구 송도2동', type: '행정동', contains_legal_divisions: ['송도동'] },
    '송도3동': { lat: 37.3700, lon: 126.6700, name: '인천시 연수구 송도3동', type: '행정동', contains_legal_divisions: ['송도동'] },
    '송도4동': { lat: 37.3650, lon: 126.6800, name: '인천시 연수구 송도4동', type: '행정동', contains_legal_divisions: ['송도동'] },
    '송도5동': { lat: 37.3600, lon: 126.6900, name: '인천시 연수구 송도5동', type: '행정동', contains_legal_divisions: ['송도동'] },

    // 연수구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 연수구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 남동구 (행정동 및 그에 속하는 법정동) =====
    '남동구_인천': { lat: 37.4046, lon: 126.7323, name: '인천시 남동구', type: '기초자치단체' },
    '구월1동': { lat: 37.4500, lon: 126.6950, name: '인천시 남동구 구월1동', type: '행정동', contains_legal_divisions: ['구월동'] },
    '구월2동': { lat: 37.4450, lon: 126.7000, name: '인천시 남동구 구월2동', type: '행정동', contains_legal_divisions: ['구월동'] },
    '구월3동': { lat: 37.4400, lon: 126.7050, name: '인천시 남동구 구월3동', type: '행정동', contains_legal_divisions: ['구월동'] },
    '구월4동': { lat: 37.4350, lon: 126.7100, name: '인천시 남동구 구월4동', type: '행정동', contains_legal_divisions: ['구월동'] },
    '간석1동': { lat: 37.4600, lon: 126.7050, name: '인천시 남동구 간석1동', type: '행정동', contains_legal_divisions: ['간석동'] },
    '간석2동': { lat: 37.4550, lon: 126.7100, name: '인천시 남동구 간석2동', type: '행정동', contains_legal_divisions: ['간석동'] },
    '간석3동': { lat: 37.4500, lon: 126.7150, name: '인천시 남동구 간석3동', type: '행정동', contains_legal_divisions: ['간석동'] },
    '간석4동': { lat: 37.4450, lon: 126.7200, name: '인천시 남동구 간석4동', type: '행정동', contains_legal_divisions: ['간석동'] },
    '만수1동': { lat: 37.4300, lon: 126.7250, name: '인천시 남동구 만수1동', type: '행정동', contains_legal_divisions: ['만수동'] },
    '만수2동': { lat: 37.4250, lon: 126.7300, name: '인천시 남동구 만수2동', type: '행정동', contains_legal_divisions: ['만수동'] },
    '만수3동': { lat: 37.4200, lon: 126.7350, name: '인천시 남동구 만수3동', type: '행정동', contains_legal_divisions: ['만수동'] },
    '만수4동': { lat: 37.4150, lon: 126.7400, name: '인천시 남동구 만수4동', type: '행정동', contains_legal_divisions: ['만수동'] },
    '만수5동': { lat: 37.4100, lon: 126.7450, name: '인천시 남동구 만수5동', type: '행정동', contains_legal_divisions: ['만수동'] },
    '만수6동': { lat: 37.4050, lon: 126.7500, name: '인천시 남동구 만수6동', type: '행정동', contains_legal_divisions: ['만수동'] },
    '장수서창동': { lat: 37.4200, lon: 126.7800, name: '인천시 남동구 장수서창동', type: '행정동', contains_legal_divisions: ['장수동', '서창동', '운연동'] },
    '남촌도림동': { lat: 37.3800, lon: 126.7500, name: '인천시 남동구 남촌도림동', type: '행정동', contains_legal_divisions: ['남촌동', '도림동', '수산동', '만수동'] },
    '논현1동': { lat: 37.3850, lon: 126.7200, name: '인천시 남동구 논현1동', type: '행정동', contains_legal_divisions: ['논현동', '고잔동'] },
    '논현2동': { lat: 37.3800, lon: 126.7150, name: '인천시 남동구 논현2동', type: '행정동', contains_legal_divisions: ['논현동', '고잔동'] },
    '논현고잔동': { lat: 37.3750, lon: 126.7100, name: '인천시 남동구 논현고잔동', type: '행정동', contains_legal_divisions: ['논현동', '고잔동'] },

    // 남동구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '장수동': { lat: 37.4200, lon: 126.7800, name: '인천시 장수동', type: '법정동', admin_parent: '장수서창동' },
    '서창동_남동구': { lat: 37.4200, lon: 126.7800, name: '인천시 서창동', type: '법정동', admin_parent: '장수서창동' },
    '운연동': { lat: 37.4200, lon: 126.7800, name: '인천시 운연동', type: '법정동', admin_parent: '장수서창동' },
    '남촌동': { lat: 37.3800, lon: 126.7500, name: '인천시 남촌동', type: '법정동', admin_parent: '남촌도림동' },
    '도림동': { lat: 37.3800, lon: 126.7500, name: '인천시 도림동', type: '법정동', admin_parent: '남촌도림동' },
    '수산동': { lat: 37.3800, lon: 126.7500, name: '인천시 수산동', type: '법정동', admin_parent: '남촌도림동' },
    '고잔동': { lat: 37.3850, lon: 126.7200, name: '인천시 고잔동', type: '법정동', admin_parent: '논현1동' },


    // ===== 부평구 (행정동 및 그에 속하는 법정동) =====
    '부평구_인천': { lat: 37.4930, lon: 126.7224, name: '인천시 부평구', type: '기초자치단체' },
    '부평1동': { lat: 37.4950, lon: 126.7200, name: '인천시 부평구 부평1동', type: '행정동', contains_legal_divisions: ['부평동'] },
    '부평2동': { lat: 37.4900, lon: 126.7250, name: '인천시 부평구 부평2동', type: '행정동', contains_legal_divisions: ['부평동'] },
    '부평3동': { lat: 37.4850, lon: 126.7300, name: '인천시 부평구 부평3동', type: '행정동', contains_legal_divisions: ['부평동'] },
    '부평4동': { lat: 37.4800, lon: 126.7350, name: '인천시 부평구 부평4동', type: '행정동', contains_legal_divisions: ['부평동'] },
    '부평5동': { lat: 37.4750, lon: 126.7400, name: '인천시 부평구 부평5동', type: '행정동', contains_legal_divisions: ['부평동'] },
    '부평6동': { lat: 37.4700, lon: 126.7450, name: '인천시 부평구 부평6동', type: '행정동', contains_legal_divisions: ['부평동'] },
    '산곡1동': { lat: 37.5000, lon: 126.7050, name: '인천시 부평구 산곡1동', type: '행정동', contains_legal_divisions: ['산곡동'] },
    '산곡2동': { lat: 37.5050, lon: 126.7100, name: '인천시 부평구 산곡2동', type: '행정동', contains_legal_divisions: ['산곡동'] },
    '산곡3동': { lat: 37.5100, lon: 126.7150, name: '인천시 부평구 산곡3동', type: '행정동', contains_legal_divisions: ['산곡동'] },
    '산곡4동': { lat: 37.5150, lon: 126.7200, name: '인천시 부평구 산곡4동', type: '행정동', contains_legal_divisions: ['산곡동'] },
    '청천1동': { lat: 37.5000, lon: 126.7300, name: '인천시 부평구 청천1동', type: '행정동', contains_legal_divisions: ['청천동'] },
    '청천2동': { lat: 37.5050, lon: 126.7350, name: '인천시 부평구 청천2동', type: '행정동', contains_legal_divisions: ['청천동'] },
    '갈산1동': { lat: 37.5100, lon: 126.7400, name: '인천시 부평구 갈산1동', type: '행정동', contains_legal_divisions: ['갈산동'] },
    '갈산2동': { lat: 37.5150, lon: 126.7450, name: '인천시 부평구 갈산2동', type: '행정동', contains_legal_divisions: ['갈산동'] },
    '삼산1동': { lat: 37.5200, lon: 126.7250, name: '인천시 부평구 삼산1동', type: '행정동', contains_legal_divisions: ['삼산동'] },
    '삼산2동': { lat: 37.5250, lon: 126.7300, name: '인천시 부평구 삼산2동', type: '행정동', contains_legal_divisions: ['삼산동'] },
    '부개1동': { lat: 37.5000, lon: 126.7500, name: '인천시 부평구 부개1동', type: '행정동', contains_legal_divisions: ['부개동'] },
    '부개2동': { lat: 37.5050, lon: 126.7550, name: '인천시 부평구 부개2동', type: '행정동', contains_legal_divisions: ['부개동'] },
    '부개3동': { lat: 37.5100, lon: 126.7600, name: '인천시 부평구 부개3동', type: '행정동', contains_legal_divisions: ['부개동'] },
    '일신동': { lat: 37.4800, lon: 126.7600, name: '인천시 부평구 일신동', type: '행정동', contains_legal_divisions: ['일신동'] },
    '십정1동': { lat: 37.4700, lon: 126.7150, name: '인천시 부평구 십정1동', type: '행정동', contains_legal_divisions: ['십정동'] },
    '십정2동': { lat: 37.4650, lon: 126.7200, name: '인천시 부평구 십정2동', type: '행정동', contains_legal_divisions: ['십정동'] },

    // 부평구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 부평구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 계양구 (행정동 및 그에 속하는 법정동) =====
    '계양구_인천': { lat: 37.5350, lon: 126.7360, name: '인천시 계양구', type: '기초자치단체' },
    '효성1동': { lat: 37.5250, lon: 126.7050, name: '인천시 계양구 효성1동', type: '행정동', contains_legal_divisions: ['효성동'] },
    '효성2동': { lat: 37.5300, lon: 126.7100, name: '인천시 계양구 효성2동', type: '행정동', contains_legal_divisions: ['효성동'] },
    '작전1동': { lat: 37.5350, lon: 126.7200, name: '인천시 계양구 작전1동', type: '행정동', contains_legal_divisions: ['작전동'] },
    '작전2동': { lat: 37.5400, lon: 126.7250, name: '인천시 계양구 작전2동', type: '행정동', contains_legal_divisions: ['작전동'] },
    '작전서운동': { lat: 37.5450, lon: 126.7300, name: '인천시 계양구 작전서운동', type: '행정동', contains_legal_divisions: ['작전동', '서운동'] },
    '계산1동': { lat: 37.5350, lon: 126.7400, name: '인천시 계양구 계산1동', type: '행정동', contains_legal_divisions: ['계산동'] },
    '계산2동': { lat: 37.5400, lon: 126.7450, name: '인천시 계양구 계산2동', type: '행정동', contains_legal_divisions: ['계산동'] },
    '계산3동': { lat: 37.5450, lon: 126.7500, name: '인천시 계양구 계산3동', type: '행정동', contains_legal_divisions: ['계산동'] },
    '계산4동': { lat: 37.5500, lon: 126.7550, name: '인천시 계양구 계산4동', type: '행정동', contains_legal_divisions: ['계산동'] },
    '계양동': { lat: 37.5600, lon: 126.7400, name: '인천시 계양구 계양동', type: '행정동', contains_legal_divisions: ['갈현동', '상야동', '하야동', '평동', '장기동', '이화동', '둑실동', '목상동', '다남동', '선주지동', '오류동'] },
    '임학동': { lat: 37.5500, lon: 126.7300, name: '인천시 계양구 임학동', type: '행정동', contains_legal_divisions: ['임학동'] },
    '병방동': { lat: 37.5550, lon: 126.7350, name: '인천시 계양구 병방동', type: '행정동', contains_legal_divisions: ['병방동'] },
    '박촌동': { lat: 37.5600, lon: 126.7400, name: '인천시 계양구 박촌동', type: '행정동', contains_legal_divisions: ['박촌동'] },
    '동양동': { lat: 37.5650, lon: 126.7450, name: '인천시 계양구 동양동', type: '행정동', contains_legal_divisions: ['동양동', '귤현동', '상야동', '하야동'] },

    // 계양구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '서운동': { lat: 37.5450, lon: 126.7300, name: '인천시 서운동', type: '법정동', admin_parent: '작전서운동' },
    '갈현동_계양구': { lat: 37.5600, lon: 126.7400, name: '인천시 갈현동', type: '법정동', admin_parent: '계양동' },
    '상야동': { lat: 37.5600, lon: 126.7400, name: '인천시 상야동', type: '법정동', admin_parent: '계양동' },
    '하야동': { lat: 37.5600, lon: 126.7400, name: '인천시 하야동', type: '법정동', admin_parent: '계양동' },
    '평동_계양구': { lat: 37.5600, lon: 126.7400, name: '인천시 평동', type: '법정동', admin_parent: '계양동' },
    '장기동_계양구': { lat: 37.5600, lon: 126.7400, name: '인천시 장기동', type: '법정동', admin_parent: '계양동' },
    '이화동': { lat: 37.5600, lon: 126.7400, name: '인천시 이화동', type: '법정동', admin_parent: '계양동' },
    '둑실동': { lat: 37.5600, lon: 126.7400, name: '인천시 둑실동', type: '법정동', admin_parent: '계양동' },
    '목상동_계양구': { lat: 37.5600, lon: 126.7400, name: '인천시 목상동', type: '법정동', admin_parent: '계양동' },
    '다남동': { lat: 37.5600, lon: 126.7400, name: '인천시 다남동', type: '법정동', admin_parent: '계양동' },
    '선주지동': { lat: 37.5600, lon: 126.7400, name: '인천시 선주지동', type: '법정동', admin_parent: '계양동' },
    '오류동_계양구': { lat: 37.5600, lon: 126.7400, name: '인천시 오류동', type: '법정동', admin_parent: '계양동' },
    '귤현동': { lat: 37.5650, lon: 126.7450, name: '인천시 귤현동', type: '법정동', admin_parent: '동양동' },


    // ===== 서구 (행정동 및 그에 속하는 법정동) =====
    '서구_인천': { lat: 37.5517, lon: 126.6669, name: '인천시 서구', type: '기초자치단체' },
    '검단동_인천': { lat: 37.5800, lon: 126.7000, name: '인천시 서구 검단동', type: '행정동', contains_legal_divisions: ['마전동', '당하동', '원당동', '불로동', '대곡동', '금곡동', '오류동', '왕길동', '백석동', '시천동', '검암동'] },
    '검단1동': { lat: 37.6000, lon: 126.6800, name: '인천시 서구 검단1동', type: '행정동', contains_legal_divisions: ['마전동', '당하동'] },
    '검단2동': { lat: 37.5950, lon: 126.6900, name: '인천시 서구 검단2동', type: '행정동', contains_legal_divisions: ['원당동', '불로동'] },
    '검단3동': { lat: 37.5900, lon: 126.7000, name: '인천시 서구 검단3동', type: '행정동', contains_legal_divisions: ['대곡동', '금곡동'] },
    '검단4동': { lat: 37.5850, lon: 126.7100, name: '인천시 서구 검단4동', type: '행정동', contains_legal_divisions: ['오류동', '왕길동'] },
    '검단5동': { lat: 37.5800, lon: 126.7200, name: '인천시 서구 검단5동', type: '행정동', contains_legal_divisions: ['백석동', '시천동'] },
    '검암경서동': { lat: 37.5700, lon: 126.6600, name: '인천시 서구 검암경서동', type: '행정동', contains_legal_divisions: ['검암동', '경서동'] },
    '연희동': { lat: 37.5600, lon: 126.6500, name: '인천시 서구 연희동', type: '행정동', contains_legal_divisions: ['연희동', '심곡동', '가정동', '공촌동', '경서동'] },
    '신현원창동': { lat: 37.5300, lon: 126.6400, name: '인천시 서구 신현원창동', type: '행정동', contains_legal_divisions: ['신현동', '원창동', '연희동'] },
    '가정1동': { lat: 37.5400, lon: 126.6700, name: '인천시 서구 가정1동', type: '행정동', contains_legal_divisions: ['가정동'] },
    '가정2동': { lat: 37.5450, lon: 126.6750, name: '인천시 서구 가정2동', type: '행정동', contains_legal_divisions: ['가정동'] },
    '가정3동': { lat: 37.5500, lon: 126.6800, name: '인천시 서구 가정3동', type: '행정동', contains_legal_divisions: ['가정동'] },
    '석남1동': { lat: 37.5100, lon: 126.6500, name: '인천시 서구 석남1동', type: '행정동', contains_legal_divisions: ['석남동'] },
    '석남2동': { lat: 37.5150, lon: 126.6550, name: '인천시 서구 석남2동', type: '행정동', contains_legal_divisions: ['석남동'] },
    '석남3동': { lat: 37.5200, lon: 126.6600, name: '인천시 서구 석남3동', type: '행정동', contains_legal_divisions: ['석남동'] },
    '가좌1동': { lat: 37.5000, lon: 126.6600, name: '인천시 서구 가좌1동', type: '행정동', contains_legal_divisions: ['가좌동'] },
    '가좌2동': { lat: 37.5050, lon: 126.6650, name: '인천시 서구 가좌2동', type: '행정동', contains_legal_divisions: ['가좌동'] },
    '가좌3동': { lat: 37.5100, lon: 126.6700, name: '인천시 서구 가좌3동', type: '행정동', contains_legal_divisions: ['가좌동'] },
    '가좌4동': { lat: 37.5150, lon: 126.6750, name: '인천시 서구 가좌4동', type: '행정동', contains_legal_divisions: ['가좌동'] },
    '청라1동': { lat: 37.5300, lon: 126.6500, name: '인천시 서구 청라1동', type: '행정동', contains_legal_divisions: ['청라동'] },
    '청라2동': { lat: 37.5350, lon: 126.6550, name: '인천시 서구 청라2동', type: '행정동', contains_legal_divisions: ['청라동'] },
    '청라3동': { lat: 37.5400, lon: 126.6600, name: '인천시 서구 청라3동', type: '행정동', contains_legal_divisions: ['청라동'] },
    '루원시티동': { lat: 37.5500, lon: 126.6700, name: '인천시 서구 루원시티동', type: '행정동', contains_legal_divisions: ['가정동'] },

    // 서구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '마전동': { lat: 37.5800, lon: 126.7000, name: '인천시 마전동', type: '법정동', admin_parent: '검단1동' },
    '당하동': { lat: 37.5800, lon: 126.7000, name: '인천시 당하동', type: '법정동', admin_parent: '검단1동' },
    '원당동': { lat: 37.5950, lon: 126.6900, name: '인천시 원당동', type: '법정동', admin_parent: '검단2동' },
    '불로동_인천': { lat: 37.5950, lon: 126.6900, name: '인천시 불로동', type: '법정동', admin_parent: '검단2동' },
    '대곡동_인천': { lat: 37.5900, lon: 126.7000, name: '인천시 대곡동', type: '법정동', admin_parent: '검단3동' },
    '금곡동_인천': { lat: 37.5900, lon: 126.7000, name: '인천시 금곡동', type: '법정동', admin_parent: '검단3동' },
    '오류동_인천': { lat: 37.5850, lon: 126.7100, name: '인천시 오류동', type: '법정동', admin_parent: '검단4동' },
    '왕길동': { lat: 37.5850, lon: 126.7100, name: '인천시 왕길동', type: '법정동', admin_parent: '검단4동' },
    '백석동': { lat: 37.5800, lon: 126.7200, name: '인천시 백석동', type: '법정동', admin_parent: '검단5동' },
    '시천동': { lat: 37.5800, lon: 126.7200, name: '인천시 시천동', type: '법정동', admin_parent: '검단5동' },
    '검암동': { lat: 37.5700, lon: 126.6600, name: '인천시 검암동', type: '법정동', admin_parent: '검암경서동' },
    '경서동': { lat: 37.5700, lon: 126.6600, name: '인천시 경서동', type: '법정동', admin_parent: '검암경서동' },
    '심곡동_인천': { lat: 37.5600, lon: 126.6500, name: '인천시 심곡동', type: '법정동', admin_parent: '연희동' },
    '가정동_인천': { lat: 37.5400, lon: 126.6700, name: '인천시 가정동', type: '법정동', admin_parent: '가정1동' },
    '공촌동': { lat: 37.5600, lon: 126.6500, name: '인천시 공촌동', type: '법정동', admin_parent: '연희동' },
    '신현동': { lat: 37.5300, lon: 126.6400, name: '인천시 신현동', type: '법정동', admin_parent: '신현원창동' },
    '원창동': { lat: 37.5300, lon: 126.6400, name: '인천시 원창동', type: '법정동', admin_parent: '신현원창동' },
    '청라동': { lat: 37.5300, lon: 126.6500, name: '인천시 청라동', type: '법정동', admin_parent: '청라1동' },


    // ===== 강화군 (읍, 면 및 그에 속하는 법정리) =====
    '강화군': { lat: 37.7479, lon: 126.4172, name: '인천시 강화군', type: '기초자치단체' },
    '강화읍': { lat: 37.7470, lon: 126.4800, name: '인천시 강화군 강화읍', type: '읍', contains_legal_divisions: ['관청리', '국화리', '남산리', '대산리', '갑곳리', '신문리', '용정리', '옥림리', '월곳리', '점량리'] },
    '길상면': { lat: 37.6000, lon: 126.4800, name: '인천시 강화군 길상면', type: '면', contains_legal_divisions: ['온수리', '길직리', '동검리', '장흥리', '선두리', '초지리'] },
    '불은면': { lat: 37.6500, lon: 126.4800, name: '인천시 강화군 불은면', type: '면', contains_legal_divisions: ['삼성리', '덕성리', '두운리', '신현리', '고능리', '오두리'] },
    '초지면': { lat: 37.6200, lon: 126.4900, name: '인천시 강화군 초지면', type: '면', contains_legal_divisions: ['초지리', '동막리'] },
    '선원면': { lat: 37.7200, lon: 126.4500, name: '인천시 강화군 선원면', type: '면', contains_legal_divisions: ['창리', '지산리', '연리', '신정리', '냉정리', '금월리'] },
    '양도면': { lat: 37.6000, lon: 126.3500, name: '인천시 강화군 양도면', type: '면', contains_legal_divisions: ['하일이', '상일이', '조산리', '능내리', '도장리', '인산리', '대흥리'] },
    '하점면': { lat: 37.7800, lon: 126.3800, name: '인천시 강화군 하점면', type: '면', contains_legal_divisions: ['이강리', '삼거리', '신봉리', '창후리', '장정리'] },
    '양사면': { lat: 37.7900, lon: 126.3400, name: '인천시 강화군 양사면', type: '면', contains_legal_divisions: ['교산리', '덕하리', '북성리', '인화리', '철산리'] },
    '송해면': { lat: 37.7700, lon: 126.4000, name: '인천시 강화군 송해면', type: '면', contains_legal_divisions: ['숭뢰리', '하도리', '당산리', '상도리', '신당리', '솔정리', '오류리'] },
    '교동면': { lat: 37.8200, lon: 126.2900, name: '인천시 강화군 교동면', type: '면', contains_legal_divisions: ['대룡리', '상룡리', '읍내리', '지석리', '동산리', '고구리', '봉소리'] },
    '삼산면': { lat: 37.7500, lon: 126.2500, name: '인천시 강화군 삼산면', type: '면', contains_legal_divisions: ['매음리', '석모리', '상리', '하리', '미법리', '서검리', '동검리'] },
    '서도면': { lat: 37.7000, lon: 126.1700, name: '인천시 강화군 서도면', type: '면', contains_legal_divisions: ['볼음리', '주문리', '아차리'] },


    // ===== 옹진군 (읍, 면 및 그에 속하는 법정리) =====
    '옹진군': { lat: 37.3800, lon: 126.3000, name: '인천시 옹진군', type: '기초자치단체' },
    '북도면': { lat: 37.4700, lon: 126.3300, name: '인천시 옹진군 북도면', type: '면', contains_legal_divisions: ['장봉리', '모도리', '시도리', '신도리'] },
    '연평면': { lat: 37.6600, lon: 125.7000, name: '인천시 옹진군 연평면', type: '면', contains_legal_divisions: ['연평리'] },
    '백령면': { lat: 37.9500, lon: 124.7000, name: '인천시 옹진군 백령면', type: '면', contains_legal_divisions: ['진촌리', '남포리', '연화리', '까치울리', '두무진리'] },
    '대청면': { lat: 37.8500, lon: 124.7500, name: '인천시 옹진군 대청면', type: '면', contains_legal_divisions: ['대청리', '소청리'] },
    '덕적면': { lat: 37.2200, lon: 126.1500, name: '인천시 옹진군 덕적면', type: '면', contains_legal_divisions: ['진리', '북리', '서포리', '울도리', '소야리', '문갑리', '굴업리', '백아리'] },
    '자월면': { lat: 37.2500, lon: 126.3500, name: '인천시 옹진군 자월면', type: '면', contains_legal_divisions: ['자월리', '이작리', '승봉리', '대부리'] },
    '영흥면': { lat: 37.2500, lon: 126.4300, name: '인천시 옹진군 영흥면', type: '면', contains_legal_divisions: ['내리', '외리', '선재리'] },












  
   '대구': { lat: 35.8714, lon: 128.6014, name: '대구시', type: '광역자치단체', aliases: ['대구광역시', '대구'] },
    '대구시': { lat: 35.8714, lon: 128.6014, name: '대구시', type: '광역자치단체', aliases: ['대구광역시', '대구'] },

    // ===== 중구 (행정동 및 그에 속하는 법정동) =====
    '중구': { lat: 35.8679, lon: 128.5906, name: '대구시 중구', type: '기초자치단체' },
    '동인동': { lat: 35.8740, lon: 128.6000, name: '대구시 중구 동인동', type: '행정동', contains_legal_divisions: ['동인동1가', '동인동2가', '동인동3가', '동인동4가'] },
    '삼덕동': { lat: 35.8660, lon: 128.6030, name: '대구시 중구 삼덕동', type: '행정동', contains_legal_divisions: ['삼덕동1가', '삼덕동2가', '삼덕동3가'] },
    '성내1동': { lat: 35.8700, lon: 128.5900, name: '대구시 중구 성내1동', type: '행정동', contains_legal_divisions: ['상서동', '수동', '포정동', '서성로1가', '서성로2가', '북성로1가', '북성로2가', '태평로1가', '태평로2가', '태평로3가', '용덕동', '향촌동', '교동', '문화동', '공평동', '동성로1가', '동성로2가', '동성로3가'] },
    '성내2동': { lat: 35.8680, lon: 128.5850, name: '대구시 중구 성내2동', type: '행정동', contains_legal_divisions: ['계산동1가', '계산동2가', '남성로', '서문로1가', '서문로2가', '동문동', '대신동', '전동', '종로1가', '종로2가', '달성동'] },
    '성내3동': { lat: 35.8640, lon: 128.5950, name: '대구시 중구 성내3동', type: '행정동', contains_legal_divisions: ['남일동', '사일동', '공평동', '덕산동', '상덕동', '봉산동', '하서동', '남산동'] },
    '대신동': { lat: 35.8630, lon: 128.5800, name: '대구시 중구 대신동', type: '행정동', contains_legal_divisions: ['대신동'] },
    '남산1동': { lat: 35.8600, lon: 128.5850, name: '대구시 중구 남산1동', type: '행정동', contains_legal_divisions: ['남산동'] },
    '남산2동': { lat: 35.8580, lon: 128.5900, name: '대구시 중구 남산2동', type: '행정동', contains_legal_divisions: ['남산동'] },
    '남산3동': { lat: 35.8550, lon: 128.5950, name: '대구시 중구 남산3동', type: '행정동', contains_legal_divisions: ['남산동'] },
    '남산4동': { lat: 35.8520, lon: 128.6000, name: '대구시 중구 남산4동', type: '행정동', contains_legal_divisions: ['남산동'] },
    '대봉1동': { lat: 35.8580, lon: 128.6050, name: '대구시 중구 대봉1동', type: '행정동', contains_legal_divisions: ['대봉동'] },
    '대봉2동': { lat: 35.8550, lon: 128.6100, name: '대구시 중구 대봉2동', type: '행정동', contains_legal_divisions: ['대봉동'] },

    // 중구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '동인동1가': { lat: 35.8740, lon: 128.6000, name: '대구시 동인동1가', type: '법정동', admin_parent: '동인동' },
    '동인동2가': { lat: 35.8740, lon: 128.6000, name: '대구시 동인동2가', type: '법정동', admin_parent: '동인동' },
    '동인동3가': { lat: 35.8740, lon: 128.6000, name: '대구시 동인동3가', type: '법정동', admin_parent: '동인동' },
    '동인동4가': { lat: 35.8740, lon: 128.6000, name: '대구시 동인동4가', type: '법정동', admin_parent: '동인동' },
    '삼덕동1가': { lat: 35.8660, lon: 128.6030, name: '대구시 삼덕동1가', type: '법정동', admin_parent: '삼덕동' },
    '삼덕동2가': { lat: 35.8660, lon: 128.6030, name: '대구시 삼덕동2가', type: '법정동', admin_parent: '삼덕동' },
    '삼덕동3가': { lat: 35.8660, lon: 128.6030, name: '대구시 삼덕동3가', type: '법정동', admin_parent: '삼덕동' },
    '상서동': { lat: 35.8700, lon: 128.5900, name: '대구시 상서동', type: '법정동', admin_parent: '성내1동' },
    '수동': { lat: 35.8700, lon: 128.5900, name: '대구시 수동', type: '법정동', admin_parent: '성내1동' },
    '포정동': { lat: 35.8700, lon: 128.5900, name: '대구시 포정동', type: '법정동', admin_parent: '성내1동' },
    '서성로1가': { lat: 35.8700, lon: 128.5900, name: '대구시 서성로1가', type: '법정동', admin_parent: '성내1동' },
    '서성로2가': { lat: 35.8700, lon: 128.5900, name: '대구시 서성로2가', type: '법정동', admin_parent: '성내1동' },
    '북성로1가': { lat: 35.8700, lon: 128.5900, name: '대구시 북성로1가', type: '법정동', admin_parent: '성내1동' },
    '북성로2가': { lat: 35.8700, lon: 128.5900, name: '대구시 북성로2가', type: '법정동', admin_parent: '성내1동' },
    '태평로1가': { lat: 35.8700, lon: 128.5900, name: '대구시 태평로1가', type: '법정동', admin_parent: '성내1동' },
    '태평로2가': { lat: 35.8700, lon: 128.5900, name: '대구시 태평로2가', type: '법정동', admin_parent: '성내1동' },
    '태평로3가': { lat: 35.8700, lon: 128.5900, name: '대구시 태평로3가', type: '법정동', admin_parent: '성내1동' },
    '용덕동': { lat: 35.8700, lon: 128.5900, name: '대구시 용덕동', type: '법정동', admin_parent: '성내1동' },
    '향촌동': { lat: 35.8700, lon: 128.5900, name: '대구시 향촌동', type: '법정동', admin_parent: '성내1동' },
    '교동': { lat: 35.8700, lon: 128.5900, name: '대구시 교동', type: '법정동', admin_parent: '성내1동' },
    '문화동': { lat: 35.8700, lon: 128.5900, name: '대구시 문화동', type: '법정동', admin_parent: '성내1동' },
    '공평동': { lat: 35.8700, lon: 128.5900, name: '대구시 공평동', type: '법정동', admin_parent: '성내1동' }, // 성내3동에도 포함
    '동성로1가': { lat: 35.8700, lon: 128.5900, name: '대구시 동성로1가', type: '법정동', admin_parent: '성내1동' },
    '동성로2가': { lat: 35.8700, lon: 128.5900, name: '대구시 동성로2가', type: '법정동', admin_parent: '성내1동' },
    '동성로3가': { lat: 35.8700, lon: 128.5900, name: '대구시 동성로3가', type: '법정동', admin_parent: '성내1동' },
    '계산동1가': { lat: 35.8680, lon: 128.5850, name: '대구시 계산동1가', type: '법정동', admin_parent: '성내2동' },
    '계산동2가': { lat: 35.8680, lon: 128.5850, name: '대구시 계산동2가', type: '법정동', admin_parent: '성내2동' },
    '남성로': { lat: 35.8680, lon: 128.5850, name: '대구시 남성로', type: '법정동', admin_parent: '성내2동' },
    '서문로1가': { lat: 35.8680, lon: 128.5850, name: '대구시 서문로1가', type: '법정동', admin_parent: '성내2동' },
    '서문로2가': { lat: 35.8680, lon: 128.5850, name: '대구시 서문로2가', type: '법정동', admin_parent: '성내2동' },
    '동문동': { lat: 35.8680, lon: 128.5850, name: '대구시 동문동', type: '법정동', admin_parent: '성내2동' },
    '대신동_중구': { lat: 35.8630, lon: 128.5800, name: '대구시 대신동', type: '법정동', admin_parent: '대신동' }, // 중구 대신동 행정동
    '전동': { lat: 35.8680, lon: 128.5850, name: '대구시 전동', type: '법정동', admin_parent: '성내2동' },
    '종로1가': { lat: 35.8680, lon: 128.5850, name: '대구시 종로1가', type: '법정동', admin_parent: '성내2동' },
    '종로2가': { lat: 35.8680, lon: 128.5850, name: '대구시 종로2가', type: '법정동', admin_parent: '성내2동' },
    '달성동': { lat: 35.8680, lon: 128.5850, name: '대구시 달성동', type: '법정동', admin_parent: '성내2동' },
    '남일동': { lat: 35.8640, lon: 128.5950, name: '대구시 남일동', type: '법정동', admin_parent: '성내3동' },
    '사일동': { lat: 35.8640, lon: 128.5950, name: '대구시 사일동', type: '법정동', admin_parent: '성내3동' },
    '덕산동': { lat: 35.8640, lon: 128.5950, name: '대구시 덕산동', type: '법정동', admin_parent: '성내3동' },
    '상덕동': { lat: 35.8640, lon: 128.5950, name: '대구시 상덕동', type: '법정동', admin_parent: '성내3동' },
    '봉산동': { lat: 35.8640, lon: 128.5950, name: '대구시 봉산동', type: '법정동', admin_parent: '성내3동' },
    '하서동': { lat: 35.8640, lon: 128.5950, name: '대구시 하서동', type: '법정동', admin_parent: '성내3동' },
    '남산동': { lat: 35.8600, lon: 128.5850, name: '대구시 남산동', type: '법정동', admin_parent: '남산1동' }, // 남산2,3,4동에도 포함
    '대봉동': { lat: 35.8580, lon: 128.6050, name: '대구시 대봉동', type: '법정동', admin_parent: '대봉1동' }, // 대봉2동에도 포함


    // ===== 동구 (행정동 및 그에 속하는 법정동) =====
    '동구': { lat: 35.8858, lon: 128.6655, name: '대구시 동구', type: '기초자치단체' },
    '신암1동': { lat: 35.8850, lon: 128.6050, name: '대구시 동구 신암1동', type: '행정동', contains_legal_divisions: ['신암동'] },
    '신암2동': { lat: 35.8900, lon: 128.6100, name: '대구시 동구 신암2동', type: '행정동', contains_legal_divisions: ['신암동'] },
    '신암3동': { lat: 35.8950, lon: 128.6150, name: '대구시 동구 신암3동', type: '행정동', contains_legal_divisions: ['신암동'] },
    '신암4동': { lat: 35.9000, lon: 128.6200, name: '대구시 동구 신암4동', type: '행정동', contains_legal_divisions: ['신암동'] },
    '신암5동': { lat: 35.9050, lon: 128.6250, name: '대구시 동구 신암5동', type: '행정동', contains_legal_divisions: ['신암동'] },
    '신천1.2동': { lat: 35.8750, lon: 128.6150, name: '대구시 동구 신천1.2동', type: '행정동', contains_legal_divisions: ['신천동'] },
    '신천3동': { lat: 35.8700, lon: 128.6200, name: '대구시 동구 신천3동', type: '행정동', contains_legal_divisions: ['신천동'] },
    '신천4동': { lat: 35.8650, lon: 128.6250, name: '대구시 동구 신천4동', type: '행정동', contains_legal_divisions: ['신천동'] },
    '효목1동': { lat: 35.8600, lon: 128.6300, name: '대구시 동구 효목1동', type: '행정동', contains_legal_divisions: ['효목동'] },
    '효목2동': { lat: 35.8550, lon: 128.6350, name: '대구시 동구 효목2동', type: '행정동', contains_legal_divisions: ['효목동'] },
    '도평동': { lat: 35.8700, lon: 128.7000, name: '대구시 동구 도평동', type: '행정동', contains_legal_divisions: ['도동', '평광동'] },
    '불로봉무동': { lat: 35.9100, lon: 128.6700, name: '대구시 동구 불로봉무동', type: '행정동', contains_legal_divisions: ['불로동', '봉무동', '지묘동'] },
    '방촌동': { lat: 35.8650, lon: 128.6500, name: '대구시 동구 방촌동', type: '행정동', contains_legal_divisions: ['방촌동'] },
    '해안동': { lat: 35.8700, lon: 128.6600, name: '대구시 동구 해안동', type: '행정동', contains_legal_divisions: ['해안동', '율암동', '신평동', '부동', '상매동', '하매동'] },
    '안심1동': { lat: 35.8750, lon: 128.6700, name: '대구시 동구 안심1동', type: '행정동', contains_legal_divisions: ['각산동', '신서동'] },
    '안심2동': { lat: 35.8800, lon: 128.6800, name: '대구시 동구 안심2동', type: '행정동', contains_legal_divisions: ['각산동', '신서동'] },
    '안심3.4동': { lat: 35.8850, lon: 128.6900, name: '대구시 동구 안심3.4동', type: '행정동', contains_legal_divisions: ['율하동', '신기동', '숙천동', '대림동', '동호동', '사복동', '매여동', '상매동'] },
    '혁신동': { lat: 35.8600, lon: 128.7000, name: '대구시 동구 혁신동', type: '행정동', contains_legal_divisions: ['신서동', '각산동', '율암동'] }, // 혁신도시 관할
    '공산동': { lat: 35.9500, lon: 128.6700, name: '대구시 동구 공산동', type: '행정동', contains_legal_divisions: ['미대동', '내동', '신무동', '송정동', '중대동', '용수동', '진인동', '능성동'] },

    // 동구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '도동': { lat: 35.8700, lon: 128.7000, name: '대구시 도동', type: '법정동', admin_parent: '도평동' },
    '평광동': { lat: 35.8700, lon: 128.7000, name: '대구시 평광동', type: '법정동', admin_parent: '도평동' },
    '불로동': { lat: 35.9100, lon: 128.6700, name: '대구시 불로동', type: '법정동', admin_parent: '불로봉무동' },
    '봉무동': { lat: 35.9100, lon: 128.6700, name: '대구시 봉무동', type: '법정동', admin_parent: '불로봉무동' },
    '지묘동': { lat: 35.9100, lon: 128.6700, name: '대구시 지묘동', type: '법정동', admin_parent: '불로봉무동' },
    '율암동': { lat: 35.8700, lon: 128.6600, name: '대구시 율암동', type: '법정동', admin_parent: '해안동' },
    '신평동': { lat: 35.8700, lon: 128.6600, name: '대구시 신평동', type: '법정동', admin_parent: '해안동' },
    '부동': { lat: 35.8700, lon: 128.6600, name: '대구시 부동', type: '법정동', admin_parent: '해안동' },
    '상매동': { lat: 35.8700, lon: 128.6600, name: '대구시 상매동', type: '법정동', admin_parent: '해안동' },
    '하매동': { lat: 35.8700, lon: 128.6600, name: '대구시 하매동', type: '법정동', admin_parent: '해안동' },
    '각산동': { lat: 35.8750, lon: 128.6700, name: '대구시 각산동', type: '법정동', admin_parent: '안심1동' },
    '신서동': { lat: 35.8750, lon: 128.6700, name: '대구시 신서동', type: '법정동', admin_parent: '안심1동' },
    '율하동': { lat: 35.8850, lon: 128.6900, name: '대구시 율하동', type: '법정동', admin_parent: '안심3.4동' },
    '신기동': { lat: 35.8850, lon: 128.6900, name: '대구시 신기동', type: '법정동', admin_parent: '안심3.4동' },
    '숙천동': { lat: 35.8850, lon: 128.6900, name: '대구시 숙천동', type: '법정동', admin_parent: '안심3.4동' },
    '대림동': { lat: 35.8850, lon: 128.6900, name: '대구시 대림동', type: '법정동', admin_parent: '안심3.4동' },
    '동호동': { lat: 35.8850, lon: 128.6900, name: '대구시 동호동', type: '법정동', admin_parent: '안심3.4동' },
    '사복동': { lat: 35.8850, lon: 128.6900, name: '대구시 사복동', type: '법정동', admin_parent: '안심3.4동' },
    '매여동': { lat: 35.8850, lon: 128.6900, name: '대구시 매여동', type: '법정동', admin_parent: '안심3.4동' },
    '미대동': { lat: 35.9500, lon: 128.6700, name: '대구시 미대동', type: '법정동', admin_parent: '공산동' },
    '내동_동구': { lat: 35.9500, lon: 128.6700, name: '대구시 내동', type: '법정동', admin_parent: '공산동' }, // 서구, 달서구에도 내동 있음
    '신무동': { lat: 35.9500, lon: 128.6700, name: '대구시 신무동', type: '법정동', admin_parent: '공산동' },
    '송정동_동구': { lat: 35.9500, lon: 128.6700, name: '대구시 송정동', type: '법정동', admin_parent: '공산동' }, // 달서구에도 송정동 있음
    '중대동': { lat: 35.9500, lon: 128.6700, name: '대구시 중대동', type: '법정동', admin_parent: '공산동' },
    '용수동': { lat: 35.9500, lon: 128.6700, name: '대구시 용수동', type: '법정동', admin_parent: '공산동' },
    '진인동': { lat: 35.9500, lon: 128.6700, name: '대구시 진인동', type: '법정동', admin_parent: '공산동' },
    '능성동': { lat: 35.9500, lon: 128.6700, name: '대구시 능성동', type: '법정동', admin_parent: '공산동' },


    // ===== 서구 (행정동 및 그에 속하는 법정동) =====
    '서구': { lat: 35.8750, lon: 128.5550, name: '대구시 서구', type: '기초자치단체' },
    '내당1동': { lat: 35.8650, lon: 128.5550, name: '대구시 서구 내당1동', type: '행정동', contains_legal_divisions: ['내당동'] },
    '내당2.3동': { lat: 35.8700, lon: 128.5600, name: '대구시 서구 내당2.3동', type: '행정동', contains_legal_divisions: ['내당동'] },
    '내당4동': { lat: 35.8750, lon: 128.5650, name: '대구시 서구 내당4동', type: '행정동', contains_legal_divisions: ['내당동'] },
    '비산1동': { lat: 35.8800, lon: 128.5700, name: '대구시 서구 비산1동', type: '행정동', contains_legal_divisions: ['비산동'] },
    '비산2.3동': { lat: 35.8850, lon: 128.5750, name: '대구시 서구 비산2.3동', type: '행정동', contains_legal_divisions: ['비산동'] },
    '비산4동': { lat: 35.8900, lon: 128.5800, name: '대구시 서구 비산4동', type: '행정동', contains_legal_divisions: ['비산동'] },
    '비산5동': { lat: 35.8950, lon: 128.5850, name: '대구시 서구 비산5동', type: '행정동', contains_legal_divisions: ['비산동'] },
    '비산6동': { lat: 35.9000, lon: 128.5900, name: '대구시 서구 비산6동', type: '행정동', contains_legal_divisions: ['비산동'] },
    '비산7동': { lat: 35.9050, lon: 128.5950, name: '대구시 서구 비산7동', type: '행정동', contains_legal_divisions: ['비산동'] },
    '평리1동': { lat: 35.8750, lon: 128.5500, name: '대구시 서구 평리1동', type: '행정동', contains_legal_divisions: ['평리동'] },
    '평리2동': { lat: 35.8800, lon: 128.5550, name: '대구시 서구 평리2동', type: '행정동', contains_legal_divisions: ['평리동'] },
    '평리3동': { lat: 35.8850, lon: 128.5600, name: '대구시 서구 평리3동', type: '행정동', contains_legal_divisions: ['평리동'] },
    '평리4동': { lat: 35.8900, lon: 128.5650, name: '대구시 서구 평리4동', type: '행정동', contains_legal_divisions: ['평리동'] },
    '평리5동': { lat: 35.8950, lon: 128.5700, name: '대구시 서구 평리5동', type: '행정동', contains_legal_divisions: ['평리동'] },
    '평리6동': { lat: 35.9000, lon: 128.5750, name: '대구시 서구 평리6동', type: '행정동', contains_legal_divisions: ['평리동'] },
    '상중이동': { lat: 35.8800, lon: 128.5300, name: '대구시 서구 상중이동', type: '행정동', contains_legal_divisions: ['상리동', '중리동', '이현동'] },
    '원대동': { lat: 35.8950, lon: 128.5900, name: '대구시 서구 원대동', type: '행정동', contains_legal_divisions: ['원대동1가', '원대동2가', '원대동3가'] },

    // 서구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '상리동': { lat: 35.8800, lon: 128.5300, name: '대구시 상리동', type: '법정동', admin_parent: '상중이동' },
    '중리동_서구': { lat: 35.8800, lon: 128.5300, name: '대구시 중리동', type: '법정동', admin_parent: '상중이동' }, // 대덕구에 중리동 있음
    '이현동': { lat: 35.8800, lon: 128.5300, name: '대구시 이현동', type: '법정동', admin_parent: '상중이동' },
    '원대동1가': { lat: 35.8950, lon: 128.5900, name: '대구시 원대동1가', type: '법정동', admin_parent: '원대동' },
    '원대동2가': { lat: 35.8950, lon: 128.5900, name: '대구시 원대동2가', type: '법정동', admin_parent: '원대동' },
    '원대동3가': { lat: 35.8950, lon: 128.5900, name: '대구시 원대동3가', type: '법정동', admin_parent: '원대동' },


    // ===== 남구 (행정동 및 그에 속하는 법정동) =====
    '남구': { lat: 35.8500, lon: 128.5930, name: '대구시 남구', type: '기초자치단체' },
    '이천동': { lat: 35.8450, lon: 128.5900, name: '대구시 남구 이천동', type: '행정동', contains_legal_divisions: ['이천동'] },
    '봉덕1동': { lat: 35.8350, lon: 128.5950, name: '대구시 남구 봉덕1동', type: '행정동', contains_legal_divisions: ['봉덕동'] },
    '봉덕2동': { lat: 35.8300, lon: 128.6000, name: '대구시 남구 봉덕2동', type: '행정동', contains_legal_divisions: ['봉덕동'] },
    '봉덕3동': { lat: 35.8250, lon: 128.6050, name: '대구시 남구 봉덕3동', type: '행정동', contains_legal_divisions: ['봉덕동'] },
    '대명1동': { lat: 35.8500, lon: 128.5800, name: '대구시 남구 대명1동', type: '행정동', contains_legal_divisions: ['대명동'] },
    '대명2동': { lat: 35.8450, lon: 128.5750, name: '대구시 남구 대명2동', type: '행정동', contains_legal_divisions: ['대명동'] },
    '대명3동': { lat: 35.8400, lon: 128.5700, name: '대구시 남구 대명3동', type: '행정동', contains_legal_divisions: ['대명동'] },
    '대명4동': { lat: 35.8350, lon: 128.5650, name: '대구시 남구 대명4동', type: '행정동', contains_legal_divisions: ['대명동'] },
    '대명5동': { lat: 35.8300, lon: 128.5600, name: '대구시 남구 대명5동', type: '행정동', contains_legal_divisions: ['대명동'] },
    '대명6동': { lat: 35.8250, lon: 128.5550, name: '대구시 남구 대명6동', type: '행정동', contains_legal_divisions: ['대명동'] },
    '대명9동': { lat: 35.8200, lon: 128.5500, name: '대구시 남구 대명9동', type: '행정동', contains_legal_divisions: ['대명동'] },
    '대명10동': { lat: 35.8150, lon: 128.5450, name: '대구시 남구 대명10동', type: '행정동', contains_legal_divisions: ['대명동'] },
    '대명11동': { lat: 35.8100, lon: 128.5400, name: '대구시 남구 대명11동', type: '행정동', contains_legal_divisions: ['대명동'] },

    // 남구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 남구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 북구 (행정동 및 그에 속하는 법정동) =====
    '북구': { lat: 35.8890, lon: 128.5800, name: '대구시 북구', type: '기초자치단체' },
    '고성동': { lat: 35.8820, lon: 128.5950, name: '대구시 북구 고성동', type: '행정동', contains_legal_divisions: ['고성동1가', '고성동2가', '고성동3가'] },
    '칠성동': { lat: 35.8800, lon: 128.6000, name: '대구시 북구 칠성동', type: '행정동', contains_legal_divisions: ['칠성동1가', '칠성동2가'] },
    '침산1동': { lat: 35.8850, lon: 128.5850, name: '대구시 북구 침산1동', type: '행정동', contains_legal_divisions: ['침산동'] },
    '침산2동': { lat: 35.8900, lon: 128.5900, name: '대구시 북구 침산2동', type: '행정동', contains_legal_divisions: ['침산동'] },
    '침산3동': { lat: 35.8950, lon: 128.5950, name: '대구시 북구 침산3동', type: '행정동', contains_legal_divisions: ['침산동'] },
    '산격1동': { lat: 35.9000, lon: 128.6000, name: '대구시 북구 산격1동', type: '행정동', contains_legal_divisions: ['산격동'] },
    '산격2동': { lat: 35.9050, lon: 128.6050, name: '대구시 북구 산격2동', type: '행정동', contains_legal_divisions: ['산격동'] },
    '산격3동': { lat: 35.9100, lon: 128.6100, name: '대구시 북구 산격3동', type: '행정동', contains_legal_divisions: ['산격동'] },
    '산격4동': { lat: 35.9150, lon: 128.6150, name: '대구시 북구 산격4동', type: '행정동', contains_legal_divisions: ['산격동'] },
    '복현1동': { lat: 35.9000, lon: 128.6200, name: '대구시 북구 복현1동', type: '행정동', contains_legal_divisions: ['복현동'] },
    '복현2동': { lat: 35.9050, lon: 128.6250, name: '대구시 북구 복현2동', type: '행정동', contains_legal_divisions: ['복현동'] },
    '검단동': { lat: 35.9100, lon: 128.6300, name: '대구시 북구 검단동', type: '행정동', contains_legal_divisions: ['검단동', '동변동', '서변동', '연경동'] },
    '무태조야동': { lat: 35.9300, lon: 128.6100, name: '대구시 북구 무태조야동', type: '행정동', contains_legal_divisions: ['무태동', '조야동', '노원동3가'] },
    '관음동': { lat: 35.9150, lon: 128.5500, name: '대구시 북구 관음동', type: '행정동', contains_legal_divisions: ['관음동'] },
    '태전1동': { lat: 35.8950, lon: 128.5350, name: '대구시 북구 태전1동', type: '행정동', contains_legal_divisions: ['태전동'] },
    '태전2동': { lat: 35.9000, lon: 128.5400, name: '대구시 북구 태전2동', type: '행정동', contains_legal_divisions: ['태전동'] },
    '구암동': { lat: 35.9050, lon: 128.5450, name: '대구시 북구 구암동', type: '행정동', contains_legal_divisions: ['구암동'] },
    '관문동': { lat: 35.8900, lon: 128.5200, name: '대구시 북구 관문동', type: '행정동', contains_legal_divisions: ['금호동', '사수동'] },
    '읍내동': { lat: 35.9300, lon: 128.5500, name: '대구시 북구 읍내동', type: '행정동', contains_legal_divisions: ['읍내동'] },
    '동천동': { lat: 35.9350, lon: 128.5550, name: '대구시 북구 동천동', type: '행정동', contains_legal_divisions: ['동천동'] },
    '국우동': { lat: 35.9400, lon: 128.5600, name: '대구시 북구 국우동', type: '행정동', contains_legal_divisions: ['국우동'] },
    '대현동': { lat: 35.8800, lon: 128.6100, name: '대구시 북구 대현동', type: '행정동', contains_legal_divisions: ['대현동'] },
    '강북동': { lat: 35.9200, lon: 128.5300, name: '대구시 북구 강북동', type: '행정동', contains_legal_divisions: ['태전동', '관음동', '구암동', '읍내동', '동천동', '국우동'] }, // 여러 법정동 포함

    // 북구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '고성동1가': { lat: 35.8820, lon: 128.5950, name: '대구시 고성동1가', type: '법정동', admin_parent: '고성동' },
    '고성동2가': { lat: 35.8820, lon: 128.5950, name: '대구시 고성동2가', type: '법정동', admin_parent: '고성동' },
    '고성동3가': { lat: 35.8820, lon: 128.5950, name: '대구시 고성동3가', type: '법정동', admin_parent: '고성동' },
    '칠성동1가': { lat: 35.8800, lon: 128.6000, name: '대구시 칠성동1가', type: '법정동', admin_parent: '칠성동' },
    '칠성동2가': { lat: 35.8800, lon: 128.6000, name: '대구시 칠성동2가', type: '법정동', admin_parent: '칠성동' },
    '동변동': { lat: 35.9100, lon: 128.6300, name: '대구시 동변동', type: '법정동', admin_parent: '검단동' },
    '서변동': { lat: 35.9100, lon: 128.6300, name: '대구시 서변동', type: '법정동', admin_parent: '검단동' },
    '연경동': { lat: 35.9100, lon: 128.6300, name: '대구시 연경동', type: '법정동', admin_parent: '검단동' },
    '무태동': { lat: 35.9300, lon: 128.6100, name: '대구시 무태동', type: '법정동', admin_parent: '무태조야동' },
    '조야동': { lat: 35.9300, lon: 128.6100, name: '대구시 조야동', type: '법정동', admin_parent: '무태조야동' },
    '노원동3가': { lat: 35.9300, lon: 128.6100, name: '대구시 노원동3가', type: '법정동', admin_parent: '무태조야동' }, // 노원동1,2가는 서구
    '금호동_북구': { lat: 35.8900, lon: 128.5200, name: '대구시 금호동', type: '법정동', admin_parent: '관문동' }, // 서구, 달성군에도 금호동 있음
    '사수동': { lat: 35.8900, lon: 128.5200, name: '대구시 사수동', type: '법정동', admin_parent: '관문동' },


    // ===== 수성구 (행정동 및 그에 속하는 법정동) =====
    '수성구': { lat: 35.8500, lon: 128.6250, name: '대구시 수성구', type: '기초자치단체' },
    '범어1동': { lat: 35.8600, lon: 128.6300, name: '대구시 수성구 범어1동', type: '행정동', contains_legal_divisions: ['범어동'] },
    '범어2동': { lat: 35.8650, lon: 128.6350, name: '대구시 수성구 범어2동', type: '행정동', contains_legal_divisions: ['범어동'] },
    '범어3동': { lat: 35.8700, lon: 128.6400, name: '대구시 수성구 범어3동', type: '행정동', contains_legal_divisions: ['범어동'] },
    '범어4동': { lat: 35.8750, lon: 128.6450, name: '대구시 수성구 범어4동', type: '행정동', contains_legal_divisions: ['범어동'] },
    '만촌1동': { lat: 35.8700, lon: 128.6500, name: '대구시 수성구 만촌1동', type: '행정동', contains_legal_divisions: ['만촌동'] },
    '만촌2동': { lat: 35.8750, lon: 128.6550, name: '대구시 수성구 만촌2동', type: '행정동', contains_legal_divisions: ['만촌동'] },
    '만촌3동': { lat: 35.8800, lon: 128.6600, name: '대구시 수성구 만촌3동', type: '행정동', contains_legal_divisions: ['만촌동'] },
    '수성1가동': { lat: 35.8550, lon: 128.6150, name: '대구시 수성구 수성1가동', type: '행정동', contains_legal_divisions: ['수성동1가'] },
    '수성2.3가동': { lat: 35.8500, lon: 128.6200, name: '대구시 수성구 수성2.3가동', type: '행정동', contains_legal_divisions: ['수성동2가', '수성동3가'] },
    '수성4가동': { lat: 35.8450, lon: 128.6250, name: '대구시 수성구 수성4가동', type: '행정동', contains_legal_divisions: ['수성동4가'] },
    '황금1동': { lat: 35.8400, lon: 128.6300, name: '대구시 수성구 황금1동', type: '행정동', contains_legal_divisions: ['황금동'] },
    '황금2동': { lat: 35.8350, lon: 128.6350, name: '대구시 수성구 황금2동', type: '행정동', contains_legal_divisions: ['황금동'] },
    '중동': { lat: 35.8300, lon: 128.6400, name: '대구시 수성구 중동', type: '행정동', contains_legal_divisions: ['중동'] },
    '상동': { lat: 35.8250, lon: 128.6450, name: '대구시 수성구 상동', type: '행정동', contains_legal_divisions: ['상동'] },
    '파동': { lat: 35.8050, lon: 128.6500, name: '대구시 수성구 파동', type: '행정동', contains_legal_divisions: ['파동'] },
    '두산동': { lat: 35.8300, lon: 128.6250, name: '대구시 수성구 두산동', type: '행정동', contains_legal_divisions: ['두산동'] },
    '지산1동': { lat: 35.8150, lon: 128.6200, name: '대구시 수성구 지산1동', type: '행정동', contains_legal_divisions: ['지산동'] },
    '지산2동': { lat: 35.8100, lon: 128.6250, name: '대구시 수성구 지산2동', type: '행정동', contains_legal_divisions: ['지산동'] },
    '범물1동': { lat: 35.8050, lon: 128.6300, name: '대구시 수성구 범물1동', type: '행정동', contains_legal_divisions: ['범물동'] },
    '범물2동': { lat: 35.8000, lon: 128.6350, name: '대구시 수성구 범물2동', type: '행정동', contains_legal_divisions: ['범물동'] },
    '고산1동': { lat: 35.8500, lon: 128.6700, name: '대구시 수성구 고산1동', type: '행정동', contains_legal_divisions: ['시지동', '고산동'] },
    '고산2동': { lat: 35.8450, lon: 128.6750, name: '대구시 수성구 고산2동', type: '행정동', contains_legal_divisions: ['매호동', '욱수동'] },
    '고산3동': { lat: 35.8400, lon: 128.6800, name: '대구시 수성구 고산3동', type: '행정동', contains_legal_divisions: ['신매동'] },

    // 수성구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '수성동1가': { lat: 35.8550, lon: 128.6150, name: '대구시 수성동1가', type: '법정동', admin_parent: '수성1가동' },
    '수성동2가': { lat: 35.8500, lon: 128.6200, name: '대구시 수성동2가', type: '법정동', admin_parent: '수성2.3가동' },
    '수성동3가': { lat: 35.8500, lon: 128.6200, name: '대구시 수성동3가', type: '법정동', admin_parent: '수성2.3가동' },
    '수성동4가': { lat: 35.8450, lon: 128.6250, name: '대구시 수성동4가', type: '법정동', admin_parent: '수성4가동' },
    '시지동': { lat: 35.8500, lon: 128.6700, name: '대구시 시지동', type: '법정동', admin_parent: '고산1동' },
    '매호동': { lat: 35.8450, lon: 128.6750, name: '대구시 매호동', type: '법정동', admin_parent: '고산2동' },
    '욱수동': { lat: 35.8450, lon: 128.6750, name: '대구시 욱수동', type: '법정동', admin_parent: '고산2동' },
    '신매동': { lat: 35.8400, lon: 128.6800, name: '대구시 신매동', type: '법정동', admin_parent: '고산3동' },


    // ===== 달서구 (행정동 및 그에 속하는 법정동) =====
    '달서구': { lat: 35.8284, lon: 128.5301, name: '대구시 달서구', type: '기초자치단체' },
    '성당동': { lat: 35.8400, lon: 128.5500, name: '대구시 달서구 성당동', type: '행정동', contains_legal_divisions: ['성당동'] },
    '두류1.2동': { lat: 35.8500, lon: 128.5450, name: '대구시 달서구 두류1.2동', type: '행정동', contains_legal_divisions: ['두류동'] },
    '두류3동': { lat: 35.8450, lon: 128.5400, name: '대구시 달서구 두류3동', type: '행정동', contains_legal_divisions: ['두류동'] },
    '본리동': { lat: 35.8400, lon: 128.5350, name: '대구시 달서구 본리동', type: '행정동', contains_legal_divisions: ['본리동'] },
    '감삼동': { lat: 35.8350, lon: 128.5300, name: '대구시 달서구 감삼동', type: '행정동', contains_legal_divisions: ['감삼동'] },
    '죽전동': { lat: 35.8300, lon: 128.5250, name: '대구시 달서구 죽전동', type: '행정동', contains_legal_divisions: ['죽전동'] },
    '장기동': { lat: 35.8250, lon: 128.5200, name: '대구시 달서구 장기동', type: '행정동', contains_legal_divisions: ['장기동'] },
    '용산1동': { lat: 35.8200, lon: 128.5150, name: '대구시 달서구 용산1동', type: '행정동', contains_legal_divisions: ['용산동'] },
    '용산2동': { lat: 35.8150, lon: 128.5100, name: '대구시 달서구 용산2동', type: '행정동', contains_legal_divisions: ['용산동'] },
    '이곡1동': { lat: 35.8100, lon: 128.5050, name: '대구시 달서구 이곡1동', type: '행정동', contains_legal_divisions: ['이곡동'] },
    '이곡2동': { lat: 35.8050, lon: 128.5000, name: '대구시 달서구 이곡2동', type: '행정동', contains_legal_divisions: ['이곡동'] },
    '신당동': { lat: 35.8000, lon: 128.4950, name: '대구시 달서구 신당동', type: '행정동', contains_legal_divisions: ['신당동'] },
    '월성1동': { lat: 35.8000, lon: 128.5300, name: '대구시 달서구 월성1동', type: '행정동', contains_legal_divisions: ['월성동'] },
    '월성2동': { lat: 35.7950, lon: 128.5250, name: '대구시 달서구 월성2동', type: '행정동', contains_legal_divisions: ['월성동'] },
    '진천동': { lat: 35.7900, lon: 128.5200, name: '대구시 달서구 진천동', type: '행정동', contains_legal_divisions: ['진천동'] },
    '상인1동': { lat: 35.7850, lon: 128.5150, name: '대구시 달서구 상인1동', type: '행정동', contains_legal_divisions: ['상인동'] },
    '상인2동': { lat: 35.7800, lon: 128.5100, name: '대구시 달서구 상인2동', type: '행정동', contains_legal_divisions: ['상인동'] },
    '상인3동': { lat: 35.7750, lon: 128.5050, name: '대구시 달서구 상인3동', type: '행정동', contains_legal_divisions: ['상인동'] },
    '도원동': { lat: 35.7700, lon: 128.5000, name: '대구시 달서구 도원동', type: '행정동', contains_legal_divisions: ['도원동'] },
    '송현1동': { lat: 35.8300, lon: 128.5400, name: '대구시 달서구 송현1동', type: '행정동', contains_legal_divisions: ['송현동'] },
    '송현2동': { lat: 35.8250, lon: 128.5350, name: '대구시 달서구 송현2동', type: '행정동', contains_legal_divisions: ['송현동'] },
    '본동': { lat: 35.8300, lon: 128.5300, name: '대구시 달서구 본동', type: '행정동', contains_legal_divisions: ['본동'] },
    '월성동': { lat: 35.7900, lon: 128.5200, name: '대구시 달서구 월성동', type: '행정동', contains_legal_divisions: ['월성동'] },
    '유천동': { lat: 35.7850, lon: 128.5050, name: '대구시 달서구 유천동', type: '행정동', contains_legal_divisions: ['유천동', '대천동'] },
    '대곡동': { lat: 35.7700, lon: 128.4900, name: '대구시 달서구 대곡동', type: '행정동', contains_legal_divisions: ['대곡동', '도원동'] },
    '호산동': { lat: 35.8050, lon: 128.4800, name: '대구시 달서구 호산동', type: '행정동', contains_legal_divisions: ['호산동', '파호동', '갈산동', '신당동'] },

    // 달서구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '대천동_달서구': { lat: 35.7850, lon: 128.5050, name: '대구시 대천동', type: '법정동', admin_parent: '유천동' }, // 수성구, 달성군에도 대천동 있음
    '파호동': { lat: 35.8050, lon: 128.4800, name: '대구시 파호동', type: '법정동', admin_parent: '호산동' },
    '갈산동_달서구': { lat: 35.8050, lon: 128.4800, name: '대구시 갈산동', type: '법정동', admin_parent: '호산동' }, // 세종시에도 갈산리 있음


    // ===== 달성군 (행정동 및 그에 속하는 법정리) =====
    '달성군': { lat: 35.7483, lon: 128.4239, name: '대구시 달성군', type: '기초자치단체' },
    '화원읍': { lat: 35.7950, lon: 128.5000, name: '대구시 달성군 화원읍', type: '읍', contains_legal_divisions: ['천내리', '명곡리', '구라리', '성산리', '대곡리', '설화리'] },
    '논공읍': { lat: 35.7200, lon: 128.4500, name: '대구시 달성군 논공읍', type: '읍', contains_legal_divisions: ['북리', '남리', '상리', '하리', '금포리', '본리리', '삼리', '위천리', '달성리'] },
    '다사읍': { lat: 35.8600, lon: 128.4700, name: '대구시 달성군 다사읍', type: '읍', contains_legal_divisions: ['매곡리', '죽곡리', '방천리', '서재리', '세천리', '문산리', '이천리', '하빈리'] }, // 하빈리 법정리는 하빈면 관할인데 다사읍에 포함된 것으로 추정
    '가창면': { lat: 35.7600, lon: 128.6200, name: '대구시 달성군 가창면', type: '면', contains_legal_divisions: ['용계리', '정대리', '오리', '단산리', '상원리', '대일동', '옥포리'] }, // 옥포리 법정리는 옥포읍 관할인데 가창면에 포함된 것으로 추정
    '현풍읍': { lat: 35.6500, lon: 128.4200, name: '대구시 달성군 현풍읍', type: '읍', contains_legal_divisions: ['성하리', '하리', '중리', '상리', '대리', '지동', '오산리', '부리', '자모리'] },
    '유가읍': { lat: 35.6200, lon: 128.4300, name: '대구시 달성군 유가읍', type: '읍', contains_legal_divisions: ['쌍계리', '상리', '양리', '용리', '음리', '가태리', '초곡리', '봉리', '본리', '한정리'] },
    '구지면': { lat: 35.5900, lon: 128.4100, name: '대구시 달성군 구지면', type: '면', contains_legal_divisions: ['창리', '평리', '오설리', '가천리', '내리', '응암리', '대암리', '고봉리', '예현리', '화원리'] },
    '하빈면': { lat: 35.8900, lon: 128.4300, name: '대구시 달성군 하빈면', type: '면', contains_legal_divisions: ['동곡리', '봉촌리', '대평리', '무등리', '기곡리', '감문리', '하산리', '묘리', '성산리'] },
    '옥포읍': { lat: 35.7500, lon: 128.5300, name: '대구시 달성군 옥포읍', type: '읍', contains_legal_divisions: ['교항리', '강림리', '김흥리', '본리리', '기세리', '신당리', '송정리'] }, // 2025.1.1부로 읍 승격



  

    '대전': { lat: 36.3504, lon: 127.3845, name: '대전시', type: '광역자치단체', aliases: ['대전광역시', '대전'] },
    '대전시': { lat: 36.3504, lon: 127.3845, name: '대전시', type: '광역자치단체', aliases: ['대전광역시', '대전'] }, // 사용자의 요청에 따라 추가된 항목

    // ===== 동구 (행정동 및 그에 속하는 법정동) =====
    '동구': { lat: 36.3317, lon: 127.4339, name: '대전시 동구', type: '기초자치단체' },
    '중앙동': { lat: 36.3262, lon: 127.4260, name: '대전시 동구 중앙동', type: '행정동', contains_legal_divisions: ['원동', '정동', '중동', '은행동', '선화동', '대흥동'] },
    '효동': { lat: 36.3050, lon: 127.4420, name: '대전시 동구 효동', type: '행정동', contains_legal_divisions: ['효동', '가오동', '천동', '신흥동'] },
    '신인동': { lat: 36.3340, lon: 127.4370, name: '대전시 동구 신인동', type: '행정동', contains_legal_divisions: ['신안동', '인동', '신흥동'] },
    '판암1동': { lat: 36.3020, lon: 127.4560, name: '대전시 동구 판암1동', type: '행정동', contains_legal_divisions: ['판암동', '삼정동'] },
    '판암2동': { lat: 36.2980, lon: 127.4600, name: '대전시 동구 판암2동', type: '행정동', contains_legal_divisions: ['판암동'] },
    '용운동': { lat: 36.3400, lon: 127.4480, name: '대전시 동구 용운동', type: '행정동', contains_legal_divisions: ['용운동', '대동'] },
    '대동': { lat: 36.3350, lon: 127.4400, name: '대전시 동구 대동', type: '행정동', contains_legal_divisions: ['대동', '자양동'] },
    '자양동': { lat: 36.3400, lon: 127.4420, name: '대전시 동구 자양동', type: '행정동', contains_legal_divisions: ['자양동', '대동'] },
    '가양1동': { lat: 36.3500, lon: 127.4280, name: '대전시 동구 가양1동', type: '행정동', contains_legal_divisions: ['가양동'] },
    '가양2동': { lat: 36.3480, lon: 127.4320, name: '대전시 동구 가양2동', type: '행정동', contains_legal_divisions: ['가양동'] },
    '홍도동': { lat: 36.3500, lon: 127.4180, name: '대전시 동구 홍도동', type: '행정동', contains_legal_divisions: ['홍도동'] },
    '산내동': { lat: 36.2500, lon: 127.4700, name: '대전시 동구 산내동', type: '행정동', contains_legal_divisions: ['낭월동', '대별동', '이사동', '대성동', '장척동', '소호동', '구도동', '금동', '추동', '비룡동', '주산동', '용계동', '사성동', '직동'] }, // 대부분 법정동
    '대청동': { lat: 36.3000, lon: 127.5000, name: '대전시 동구 대청동', type: '행정동', contains_legal_divisions: ['신상동', '신하동', '효평동', '주촌동', '직동', '마산동', '오동', '주산동', '용계동', '사성동', '비룡동', '추동', '세천동'] }, // 대부분 법정동
    '대신동': { lat: 36.3300, lon: 127.4300, name: '대전시 동구 대신동', type: '행정동', contains_legal_divisions: ['신흥동', '소제동', '원동', '정동', '중동'] },

    // 동구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '원동': { lat: 36.3262, lon: 127.4260, name: '대전시 원동', type: '법정동', admin_parent: '중앙동' },
    '정동': { lat: 36.3262, lon: 127.4260, name: '대전시 정동', type: '법정동', admin_parent: '중앙동' },
    '중동': { lat: 36.3262, lon: 127.4260, name: '대전시 중동', type: '법정동', admin_parent: '중앙동' },
    '은행동': { lat: 36.3262, lon: 127.4260, name: '대전시 은행동', type: '법정동', admin_parent: '중앙동' },
    '선화동': { lat: 36.3262, lon: 127.4260, name: '대전시 선화동', type: '법정동', admin_parent: '중앙동' },
    '대흥동': { lat: 36.3262, lon: 127.4260, name: '대전시 대흥동', type: '법정동', admin_parent: '중앙동' }, // 중구에도 대흥동 있음
    '가오동': { lat: 36.3050, lon: 127.4420, name: '대전시 가오동', type: '법정동', admin_parent: '효동' },
    '천동': { lat: 36.3050, lon: 127.4420, name: '대전시 천동', type: '법정동', admin_parent: '효동' },
    '신흥동': { lat: 36.3340, lon: 127.4370, name: '대전시 신흥동', type: '법정동', admin_parent: '신인동' }, // 효동에도 포함
    '신안동': { lat: 36.3340, lon: 127.4370, name: '대전시 신안동', type: '법정동', admin_parent: '신인동' },
    '인동': { lat: 36.3340, lon: 127.4370, name: '대전시 인동', type: '법정동', admin_parent: '신인동' },
    '판암동': { lat: 36.3020, lon: 127.4560, name: '대전시 판암동', type: '법정동', admin_parent: '판암1동' },
    '삼정동': { lat: 36.3020, lon: 127.4560, name: '대전시 삼정동', type: '법정동', admin_parent: '판암1동' },
    '대동_동구': { lat: 36.3350, lon: 127.4400, name: '대전시 대동', type: '법정동', admin_parent: '대동' }, // 용운동, 자양동에도 포함
    '낭월동': { lat: 36.2500, lon: 127.4700, name: '대전시 낭월동', type: '법정동', admin_parent: '산내동' },
    '대별동': { lat: 36.2500, lon: 127.4700, name: '대전시 대별동', type: '법정동', admin_parent: '산내동' },
    '이사동': { lat: 36.2500, lon: 127.4700, name: '대전시 이사동', type: '법정동', admin_parent: '산내동' },
    '대성동': { lat: 36.2500, lon: 127.4700, name: '대전시 대성동', type: '법정동', admin_parent: '산내동' },
    '장척동': { lat: 36.2500, lon: 127.4700, name: '대전시 장척동', type: '법정동', admin_parent: '산내동' },
    '소호동': { lat: 36.2500, lon: 127.4700, name: '대전시 소호동', type: '법정동', admin_parent: '산내동' },
    '구도동': { lat: 36.2500, lon: 127.4700, name: '대전시 구도동', type: '법정동', admin_parent: '산내동' },
    '금동': { lat: 36.2500, lon: 127.4700, name: '대전시 금동', type: '법정동', admin_parent: '산내동' },
    '추동': { lat: 36.2500, lon: 127.4700, name: '대전시 추동', type: '법정동', admin_parent: '산내동' },
    '비룡동': { lat: 36.2500, lon: 127.4700, name: '대전시 비룡동', type: '법정동', admin_parent: '산내동' },
    '주산동': { lat: 36.2500, lon: 127.4700, name: '대전시 주산동', type: '법정동', admin_parent: '산내동' },
    '용계동': { lat: 36.2500, lon: 127.4700, name: '대전시 용계동', type: '법정동', admin_parent: '산내동' },
    '사성동': { lat: 36.2500, lon: 127.4700, name: '대전시 사성동', type: '법정동', admin_parent: '산내동' },
    '직동': { lat: 36.2500, lon: 127.4700, name: '대전시 직동', type: '법정동', admin_parent: '산내동' },
    '신상동': { lat: 36.3000, lon: 127.5000, name: '대전시 신상동', type: '법정동', admin_parent: '대청동' },
    '신하동': { lat: 36.3000, lon: 127.5000, name: '대전시 신하동', type: '법정동', admin_parent: '대청동' },
    '효평동': { lat: 36.3000, lon: 127.5000, name: '대전시 효평동', type: '법정동', admin_parent: '대청동' },
    '주촌동': { lat: 36.3000, lon: 127.5000, name: '대전시 주촌동', type: '법정동', admin_parent: '대청동' },
    '마산동': { lat: 36.3000, lon: 127.5000, name: '대전시 마산동', type: '법정동', admin_parent: '대청동' },
    '오동': { lat: 36.3000, lon: 127.5000, name: '대전시 오동', type: '법정동', admin_parent: '대청동' },
    '세천동': { lat: 36.3000, lon: 127.5000, name: '대전시 세천동', type: '법정동', admin_parent: '대청동' },
    '소제동': { lat: 36.3300, lon: 127.4300, name: '대전시 소제동', type: '법정동', admin_parent: '대신동' },


    // ===== 중구 (행정동 및 그에 속하는 법정동) =====
    '중구': { lat: 36.3262, lon: 127.4260, name: '대전시 중구', type: '기초자치단체' },
    '은행선화동': { lat: 36.3262, lon: 127.4260, name: '대전시 중구 은행선화동', type: '행정동', contains_legal_divisions: ['은행동', '선화동'] },
    '목동': { lat: 36.3300, lon: 127.4150, name: '대전시 중구 목동', type: '행정동', contains_legal_divisions: ['목동'] },
    '중촌동': { lat: 36.3350, lon: 127.4100, name: '대전시 중구 중촌동', type: '행정동', contains_legal_divisions: ['중촌동'] },
    '대흥동': { lat: 36.3200, lon: 127.4200, name: '대전시 중구 대흥동', type: '행정동', contains_legal_divisions: ['대흥동'] },
    '문창동': { lat: 36.3150, lon: 127.4300, name: '대전시 중구 문창동', type: '행정동', contains_legal_divisions: ['문창동'] },
    '석교동': { lat: 36.3000, lon: 127.4350, name: '대전시 중구 석교동', type: '행정동', contains_legal_divisions: ['석교동', '옥계동'] },
    '대사동': { lat: 36.3150, lon: 127.4150, name: '대전시 중구 대사동', type: '행정동', contains_legal_divisions: ['대사동', '문창동'] },
    '부사동': { lat: 36.3100, lon: 127.4200, name: '대전시 중구 부사동', type: '행정동', contains_legal_divisions: ['부사동'] },
    '용두동': { lat: 36.3250, lon: 127.4050, name: '대전시 중구 용두동', type: '행정동', contains_legal_divisions: ['용두동'] },
    '오류동': { lat: 36.3300, lon: 127.4000, name: '대전시 중구 오류동', type: '행정동', contains_legal_divisions: ['오류동'] },
    '태평1동': { lat: 36.3150, lon: 127.3950, name: '대전시 중구 태평1동', type: '행정동', contains_legal_divisions: ['태평동'] },
    '태평2동': { lat: 36.3100, lon: 127.3900, name: '대전시 중구 태평2동', type: '행정동', contains_legal_divisions: ['태평동'] },
    '유천1동': { lat: 36.3050, lon: 127.3850, name: '대전시 중구 유천1동', type: '행정동', contains_legal_divisions: ['유천동'] },
    '유천2동': { lat: 36.3000, lon: 127.3800, name: '대전시 중구 유천2동', type: '행정동', contains_legal_divisions: ['유천동'] },
    '문화1동': { lat: 36.3050, lon: 127.4050, name: '대전시 중구 문화1동', type: '행정동', contains_legal_divisions: ['문화동'] },
    '문화2동': { lat: 36.3000, lon: 127.4100, name: '대전시 중구 문화2동', type: '행정동', contains_legal_divisions: ['문화동'] },
    '산성동': { lat: 36.2700, lon: 127.4000, name: '대전시 중구 산성동', type: '행정동', contains_legal_divisions: ['산성동', '무수동', '운남동', '구완동', '침산동', '목달동', '정생동'] },

    // 중구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '옥계동': { lat: 36.3000, lon: 127.4350, name: '대전시 옥계동', type: '법정동', admin_parent: '석교동' },
    '무수동': { lat: 36.2700, lon: 127.4000, name: '대전시 무수동', type: '법정동', admin_parent: '산성동' },
    '운남동_중구': { lat: 36.2700, lon: 127.4000, name: '대전시 운남동', type: '법정동', admin_parent: '산성동' }, // 광산구와 이름 중복 방지
    '구완동': { lat: 36.2700, lon: 127.4000, name: '대전시 구완동', type: '법정동', admin_parent: '산성동' },
    '침산동_중구': { lat: 36.2700, lon: 127.4000, name: '대전시 침산동', type: '법정동', admin_parent: '산성동' }, // 대덕구와 이름 중복 방지
    '목달동': { lat: 36.2700, lon: 127.4000, name: '대전시 목달동', type: '법정동', admin_parent: '산성동' },
    '정생동': { lat: 36.2700, lon: 127.4000, name: '대전시 정생동', type: '법정동', admin_parent: '산성동' },


    // ===== 서구 (행정동 및 그에 속하는 법정동) =====
    '서구': { lat: 36.3504, lon: 127.3845, name: '대전시 서구', type: '기초자치단체' },
    '복수동': { lat: 36.3050, lon: 127.3750, name: '대전시 서구 복수동', type: '행정동', contains_legal_divisions: ['복수동'] },
    '도마1동': { lat: 36.3100, lon: 127.3700, name: '대전시 서구 도마1동', type: '행정동', contains_legal_divisions: ['도마동'] },
    '도마2동': { lat: 36.3050, lon: 127.3650, name: '대전시 서구 도마2동', type: '행정동', contains_legal_divisions: ['도마동'] },
    '정림동': { lat: 36.2950, lon: 127.3600, name: '대전시 서구 정림동', type: '행정동', contains_legal_divisions: ['정림동'] },
    '변동': { lat: 36.3200, lon: 127.3600, name: '대전시 서구 변동', type: '행정동', contains_legal_divisions: ['변동'] },
    '괴정동': { lat: 36.3400, lon: 127.3800, name: '대전시 서구 괴정동', type: '행정동', contains_legal_divisions: ['괴정동'] },
    '가장동': { lat: 36.3350, lon: 127.3750, name: '대전시 서구 가장동', type: '행정동', contains_legal_divisions: ['가장동'] },
    '내동': { lat: 36.3400, lon: 127.3700, name: '대전시 서구 내동', type: '행정동', contains_legal_divisions: ['내동'] },
    '가수원동': { lat: 36.2850, lon: 127.3350, name: '대전시 서구 가수원동', type: '행정동', contains_legal_divisions: ['가수원동', '관저동'] },
    '관저1동': { lat: 36.2750, lon: 127.3200, name: '대전시 서구 관저1동', type: '행정동', contains_legal_divisions: ['관저동'] },
    '관저2동': { lat: 36.2700, lon: 127.3150, name: '대전시 서구 관저2동', type: '행정동', contains_legal_divisions: ['관저동'] },
    '기성동': { lat: 36.2500, lon: 127.2800, name: '대전시 서구 기성동', type: '행정동', contains_legal_divisions: ['장안동', '평촌동', '오동', '우명동', '원정동', '용촌동', '흑석동', '매노동', '산직동', '장평동'] },
    '탄방동': { lat: 36.3450, lon: 127.3950, name: '대전시 서구 탄방동', type: '행정동', contains_legal_divisions: ['탄방동'] },
    '둔산1동': { lat: 36.3500, lon: 127.3900, name: '대전시 서구 둔산1동', type: '행정동', contains_legal_divisions: ['둔산동'] },
    '둔산2동': { lat: 36.3550, lon: 127.3850, name: '대전시 서구 둔산2동', type: '행정동', contains_legal_divisions: ['둔산동'] },
    '둔산3동': { lat: 36.3600, lon: 127.3900, name: '대전시 서구 둔산3동', type: '행정동', contains_legal_divisions: ['둔산동'] },
    '갈마1동': { lat: 36.3450, lon: 127.3700, name: '대전시 서구 갈마1동', type: '행정동', contains_legal_divisions: ['갈마동'] },
    '갈마2동': { lat: 36.3400, lon: 127.3650, name: '대전시 서구 갈마2동', type: '행정동', contains_legal_divisions: ['갈마동'] },
    '월평1동': { lat: 36.3600, lon: 127.3650, name: '대전시 서구 월평1동', type: '행정동', contains_legal_divisions: ['월평동'] },
    '월평2동': { lat: 36.3650, lon: 127.3700, name: '대전시 서구 월평2동', type: '행정동', contains_legal_divisions: ['월평동'] },
    '월평3동': { lat: 36.3700, lon: 127.3750, name: '대전시 서구 월평3동', type: '행정동', contains_legal_divisions: ['월평동'] },
    '만년동': { lat: 36.3700, lon: 127.3850, name: '대전시 서구 만년동', type: '행정동', contains_legal_divisions: ['만년동'] },
    '도안동': { lat: 36.3000, lon: 127.3400, name: '대전시 서구 도안동', type: '행정동', contains_legal_divisions: ['도안동', '관저동', '용계동'] }, // 유성구 도안동과 구분 필요

    // 서구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '도마동': { lat: 36.3100, lon: 127.3700, name: '대전시 도마동', type: '법정동', admin_parent: '도마1동' },
    '관저동': { lat: 36.2750, lon: 127.3200, name: '대전시 관저동', type: '법정동', admin_parent: '관저1동' }, // 가수원동, 관저2동, 도안동에도 포함
    '장안동': { lat: 36.2500, lon: 127.2800, name: '대전시 장안동', type: '법정동', admin_parent: '기성동' },
    '평촌동': { lat: 36.2500, lon: 127.2800, name: '대전시 평촌동', type: '법정동', admin_parent: '기성동' },
    '오동_서구': { lat: 36.2500, lon: 127.2800, name: '대전시 오동', type: '법정동', admin_parent: '기성동' }, // 동구에 오동이 있음
    '우명동': { lat: 36.2500, lon: 127.2800, name: '대전시 우명동', type: '법정동', admin_parent: '기성동' },
    '원정동': { lat: 36.2500, lon: 127.2800, name: '대전시 원정동', type: '법정동', admin_parent: '기성동' },
    '용촌동': { lat: 36.2500, lon: 127.2800, name: '대전시 용촌동', type: '법정동', admin_parent: '기성동' },
    '흑석동': { lat: 36.2500, lon: 127.2800, name: '대전시 흑석동', type: '법정동', admin_parent: '기성동' },
    '매노동': { lat: 36.2500, lon: 127.2800, name: '대전시 매노동', type: '법정동', admin_parent: '기성동' },
    '산직동': { lat: 36.2500, lon: 127.2800, name: '대전시 산직동', type: '법정동', admin_parent: '기성동' },
    '장평동': { lat: 36.2500, lon: 127.2800, name: '대전시 장평동', type: '법정동', admin_parent: '기성동' },
    '둔산동': { lat: 36.3500, lon: 127.3900, name: '대전시 둔산동', type: '법정동', admin_parent: '둔산1동' }, // 둔산2동, 둔산3동에도 포함
    '갈마동': { lat: 36.3450, lon: 127.3700, name: '대전시 갈마동', type: '법정동', admin_parent: '갈마1동' },
    '월평동': { lat: 36.3600, lon: 127.3650, name: '대전시 월평동', type: '법정동', admin_parent: '월평1동' },
    '도안동': { lat: 36.3000, lon: 127.3400, name: '대전시 도안동', type: '법정동', admin_parent: '도안동' }, // 유성구에도 도안동 있음
    '세동': { lat: 36.3000, lon: 127.3400, name: '대전시 세동', type: '법정동', admin_parent: '도안동' }, // 유성구에 법정동 세동이 있는데, 서구 도안동 관할로 추정


    // ===== 유성구 (행정동 및 그에 속하는 법정동) =====
    '유성구': { lat: 36.3664, lon: 127.3450, name: '대전시 유성구', type: '기초자치단체' },
    '진잠동': { lat: 36.3000, lon: 127.3200, name: '대전시 유성구 진잠동', type: '행정동', contains_legal_divisions: ['성북동', '세동', '송정동', '방동', '원내동', '교촌동', '대정동', '용계동', '학하동'] },
    '학하동': { lat: 36.3400, lon: 127.3100, name: '대전시 유성구 학하동', type: '행정동', contains_legal_divisions: ['학하동', '원신흥동'] }, // 2025.1.1부로 행정동 승격
    '상대동': { lat: 36.3500, lon: 127.3300, name: '대전시 유성구 상대동', type: '행정동', contains_legal_divisions: ['상대동', '원신흥동'] },
    '원신흥동': { lat: 36.3450, lon: 127.3200, name: '대전시 유성구 원신흥동', type: '행정동', contains_legal_divisions: ['원신흥동'] }, // 2025.1.1부로 행정동 승격
    '온천1동': { lat: 36.3600, lon: 127.3400, name: '대전시 유성구 온천1동', type: '행정동', contains_legal_divisions: ['봉명동', '구암동'] },
    '온천2동': { lat: 36.3650, lon: 127.3500, name: '대전시 유성구 온천2동', type: '행정동', contains_legal_divisions: ['장대동', '궁동', '어은동'] },
    '노은1동': { lat: 36.3800, lon: 127.3400, name: '대전시 유성구 노은1동', type: '행정동', contains_legal_divisions: ['지족동', '반석동', '외삼동'] },
    '노은2동': { lat: 36.3850, lon: 127.3500, name: '대전시 유성구 노은2동', type: '행정동', contains_legal_divisions: ['지족동'] },
    '노은3동': { lat: 36.3900, lon: 127.3550, name: '대전시 유성구 노은3동', type: '행정동', contains_legal_divisions: ['지족동'] },
    '신성동': { lat: 36.4000, lon: 127.3700, name: '대전시 유성구 신성동', type: '행정동', contains_legal_divisions: ['가정동', '덕진동', '하기동', '추목동', '도룡동', '신성동', '자운대동', '화암동', '전민동', '문지동', '원촌동'] },
    '전민동': { lat: 36.3800, lon: 127.4000, name: '대전시 유성구 전민동', type: '행정동', contains_legal_divisions: ['전민동', '문지동'] },
    '구즉동': { lat: 36.4200, lon: 127.3700, name: '대전시 유성구 구즉동', type: '행정동', contains_legal_divisions: ['송강동', '봉산동', '관평동', '용산동', '탑립동', '장동', '금고동', '대덕동'] },
    '관평동': { lat: 36.4300, lon: 127.4000, name: '대전시 유성구 관평동', type: '행정동', contains_legal_divisions: ['관평동'] },
    '어은동': { lat: 36.3600, lon: 127.3600, name: '대전시 유성구 어은동', type: '행정동', contains_legal_divisions: ['어은동'] },
    '동운동': { lat: 36.3550, lon: 127.3350, name: '대전시 유성구 동운동', type: '행정동', contains_legal_divisions: ['원신흥동', '봉명동', '구암동'] }, // 2025.1.1 신설

    // 유성구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '성북동': { lat: 36.3000, lon: 127.3200, name: '대전시 성북동', type: '법정동', admin_parent: '진잠동' },
    '송정동_유성구': { lat: 36.3000, lon: 127.3200, name: '대전시 송정동', type: '법정동', admin_parent: '진잠동' }, // 광산구와 이름 중복 방지
    '방동': { lat: 36.3000, lon: 127.3200, name: '대전시 방동', type: '법정동', admin_parent: '진잠동' },
    '원내동': { lat: 36.3000, lon: 127.3200, name: '대전시 원내동', type: '법정동', admin_parent: '진잠동' },
    '교촌동': { lat: 36.3000, lon: 127.3200, name: '대전시 교촌동', type: '법정동', admin_parent: '진잠동' },
    '대정동': { lat: 36.3000, lon: 127.3200, name: '대전시 대정동', type: '법정동', admin_parent: '진잠동' },
    '용계동_유성구': { lat: 36.3000, lon: 127.3200, name: '대전시 용계동', type: '법정동', admin_parent: '진잠동' }, // 동구와 이름 중복 방지
    '봉명동': { lat: 36.3600, lon: 127.3400, name: '대전시 봉명동', type: '법정동', admin_parent: '온천1동' }, // 동운동에도 포함
    '구암동': { lat: 36.3600, lon: 127.3400, name: '대전시 구암동', type: '법정동', admin_parent: '온천1동' }, // 동운동에도 포함
    '장대동': { lat: 36.3650, lon: 127.3500, name: '대전시 장대동', type: '법정동', admin_parent: '온천2동' },
    '궁동': { lat: 36.3650, lon: 127.3500, name: '대전시 궁동', type: '법정동', admin_parent: '온천2동' }, // 동구에도 궁동 있음
    '지족동': { lat: 36.3800, lon: 127.3400, name: '대전시 지족동', type: '법정동', admin_parent: '노은1동' }, // 노은2동, 노은3동에도 포함
    '반석동': { lat: 36.3800, lon: 127.3400, name: '대전시 반석동', type: '법정동', admin_parent: '노은1동' },
    '외삼동': { lat: 36.3800, lon: 127.3400, name: '대전시 외삼동', type: '법정동', admin_parent: '노은1동' },
    '가정동': { lat: 36.4000, lon: 127.3700, name: '대전시 가정동', type: '법정동', admin_parent: '신성동' },
    '덕진동': { lat: 36.4000, lon: 127.3700, name: '대전시 덕진동', type: '법정동', admin_parent: '신성동' },
    '하기동': { lat: 36.4000, lon: 127.3700, name: '대전시 하기동', type: '법정동', admin_parent: '신성동' },
    '추목동': { lat: 36.4000, lon: 127.3700, name: '대전시 추목동', type: '법정동', admin_parent: '신성동' },
    '도룡동': { lat: 36.4000, lon: 127.3700, name: '대전시 도룡동', type: '법정동', admin_parent: '신성동' },
    '신성동_유성구': { lat: 36.4000, lon: 127.3700, name: '대전시 신성동', type: '법정동', admin_parent: '신성동' }, // 동구에 신인동에 신흥동, 신안동 있음
    '자운대동': { lat: 36.4000, lon: 127.3700, name: '대전시 자운대동', type: '법정동', admin_parent: '신성동' },
    '화암동': { lat: 36.4000, lon: 127.3700, name: '대전시 화암동', type: '법정동', admin_parent: '신성동' },
    '문지동': { lat: 36.3800, lon: 127.4000, name: '대전시 문지동', type: '법정동', admin_parent: '전민동' },
    '송강동': { lat: 36.4200, lon: 127.3700, name: '대전시 송강동', type: '법정동', admin_parent: '구즉동' },
    '봉산동': { lat: 36.4200, lon: 127.3700, name: '대전시 봉산동', type: '법정동', admin_parent: '구즉동' },
    '용산동_유성구': { lat: 36.4200, lon: 127.3700, name: '대전시 용산동', type: '법정동', admin_parent: '구즉동' }, // 동구에 용산동 있음
    '탑립동': { lat: 36.4200, lon: 127.3700, name: '대전시 탑립동', type: '법정동', admin_parent: '구즉동' },
    '장동_유성구': { lat: 36.4200, lon: 127.3700, name: '대전시 장동', type: '법정동', admin_parent: '구즉동' }, // 동구에 장동 있음
    '금고동': { lat: 36.4200, lon: 127.3700, name: '대전시 금고동', type: '법정동', admin_parent: '구즉동' },
    '대덕동': { lat: 36.4200, lon: 127.3700, name: '대전시 대덕동', type: '법정동', admin_parent: '구즉동' },
    '원촌동': { lat: 36.4000, lon: 127.3700, name: '대전시 원촌동', type: '법정동', admin_parent: '신성동' },


    // ===== 대덕구 (행정동 및 그에 속하는 법정동) =====
    '대덕구': { lat: 36.3750, lon: 127.4000, name: '대전시 대덕구', type: '기초자치단체' },
    '오정동': { lat: 36.3700, lon: 127.4050, name: '대전시 대덕구 오정동', type: '행정동', contains_legal_divisions: ['오정동', '대화동'] },
    '대화동': { lat: 36.3650, lon: 127.4100, name: '대전시 대덕구 대화동', type: '행정동', contains_legal_divisions: ['대화동'] },
    '회덕동': { lat: 36.3900, lon: 127.4200, name: '대전시 대덕구 회덕동', type: '행정동', contains_legal_divisions: ['신탄진동', '덕암동', '석봉동', '목상동', '문평동', '상서동', '평촌동', '신대동', '와동'] },
    '송촌동': { lat: 36.3700, lon: 127.4300, name: '대전시 대덕구 송촌동', type: '행정동', contains_legal_divisions: ['송촌동'] },
    '중리동': { lat: 36.3650, lon: 127.4200, name: '대전시 대덕구 중리동', type: '행정동', contains_legal_divisions: ['중리동'] },
    '법1동': { lat: 36.3750, lon: 127.4150, name: '대전시 대덕구 법1동', type: '행정동', contains_legal_divisions: ['법동'] },
    '법2동': { lat: 36.3800, lon: 127.4200, name: '대전시 대덕구 법2동', type: '행정동', contains_legal_divisions: ['법동'] },
    '신탄진동': { lat: 36.4300, lon: 127.4250, name: '대전시 대덕구 신탄진동', type: '행정동', contains_legal_divisions: ['신탄진동', '덕암동', '석봉동', '목상동'] },
    '비래동': { lat: 36.3550, lon: 127.4400, name: '대전시 대덕구 비래동', type: '행정동', contains_legal_divisions: ['비래동'] },

    // 대덕구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '대화동_대덕구': { lat: 36.3650, lon: 127.4100, name: '대전시 대화동', type: '법정동', admin_parent: '대화동' }, // 동구에도 대화동 있음
    '문평동': { lat: 36.3900, lon: 127.4200, name: '대전시 문평동', type: '법정동', admin_parent: '회덕동' },
    '상서동': { lat: 36.3900, lon: 127.4200, name: '대전시 상서동', type: '법정동', admin_parent: '회덕동' },
    '평촌동_대덕구': { lat: 36.3900, lon: 127.4200, name: '대전시 평촌동', type: '법정동', admin_parent: '회덕동' }, // 서구에도 평촌동 있음
    '신대동': { lat: 36.3900, lon: 127.4200, name: '대전시 신대동', type: '법정동', admin_parent: '회덕동' },
    '와동': { lat: 36.3900, lon: 127.4200, name: '대전시 와동', type: '법정동', admin_parent: '회덕동' },
    '덕암동': { lat: 36.4300, lon: 127.4250, name: '대전시 덕암동', type: '법정동', admin_parent: '신탄진동' },
    '석봉동': { lat: 36.4300, lon: 127.4250, name: '대전시 석봉동', type: '법정동', admin_parent: '신탄진동' },
    '목상동': { lat: 36.4300, lon: 127.4250, name: '대전시 목상동', type: '법정동', admin_parent: '신탄진동' },




    '광주': { lat: 35.1595, lon: 126.8526, name: '광주시', type: '광역자치단체', aliases: ['광주광역시', '광주'] },
    '광주시': { lat: 35.1595, lon: 126.8526, name: '광주시', type: '광역자치단체', aliases: ['광주광역시', '광주'] }, // 사용자의 요청에 따라 추가된 항목

    // ===== 동구 (행정동 및 그에 속하는 법정동) =====
    '동구': { lat: 35.1481, lon: 126.9204, name: '광주시 동구', type: '기초자치단체' },
    '충장동': { lat: 35.1480, lon: 126.9150, name: '광주시 동구 충장동', type: '행정동', contains_legal_divisions: ['금동', '궁동', '광산동', '대인동', '불로동', '수기동', '장동', '충장로1가', '충장로2가', '충장로3가', '충장로4가', '충장로5가', '황금동'] },
    '동명동': { lat: 35.1500, lon: 126.9200, name: '광주시 동구 동명동', type: '행정동', contains_legal_divisions: ['동명동'] },
    '계림1동': { lat: 35.1550, lon: 126.9250, name: '광주시 동구 계림1동', type: '행정동', contains_legal_divisions: ['계림동'] },
    '계림2동': { lat: 35.1520, lon: 126.9300, name: '광주시 동구 계림2동', type: '행정동', contains_legal_divisions: ['계림동'] },
    '산수1동': { lat: 35.1600, lon: 126.9300, name: '광주시 동구 산수1동', type: '행정동', contains_legal_divisions: ['산수동'] },
    '산수2동': { lat: 35.1630, lon: 126.9250, name: '광주시 동구 산수2동', type: '행정동', contains_legal_divisions: ['산수동'] },
    '지산1동': { lat: 35.1580, lon: 126.9180, name: '광주시 동구 지산1동', type: '행정동', contains_legal_divisions: ['지산동'] },
    '지산2동': { lat: 35.1550, lon: 126.9150, name: '광주시 동구 지산2동', type: '행정동', contains_legal_divisions: ['지산동'] },
    '서남동': { lat: 35.1450, lon: 126.9100, name: '광주시 동구 서남동', type: '행정동', contains_legal_divisions: ['남동', '서석동', '장동', '금동', '충장로2가'] }, // 장동, 금동, 충장로2가 중복되므로 법정동 항목은 해당 법정동의 주요 행정동으로 연결
    '학동': { lat: 35.1380, lon: 126.9200, name: '광주시 동구 학동', type: '행정동', contains_legal_divisions: ['학동'] },
    '지원1동': { lat: 35.1300, lon: 126.9250, name: '광주시 동구 지원1동', type: '행정동', contains_legal_divisions: ['소태동', '용산동', '운림동'] },
    '지원2동': { lat: 35.1250, lon: 126.9300, name: '광주시 동구 지원2동', type: '행정동', contains_legal_divisions: ['소태동', '월남동', '내남동'] },

    // 동구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '금동': { lat: 35.1480, lon: 126.9150, name: '광주시 금동', type: '법정동', admin_parent: '충장동' },
    '궁동': { lat: 35.1480, lon: 126.9150, name: '광주시 궁동', type: '법정동', admin_parent: '충장동' },
    '광산동_동구': { lat: 35.1480, lon: 126.9150, name: '광주시 광산동', type: '법정동', admin_parent: '충장동' }, // 광산구와 이름 중복 방지
    '대인동': { lat: 35.1480, lon: 126.9150, name: '광주시 대인동', type: '법정동', admin_parent: '충장동' },
    '불로동': { lat: 35.1480, lon: 126.9150, name: '광주시 불로동', type: '법정동', admin_parent: '충장동' },
    '수기동': { lat: 35.1480, lon: 126.9150, name: '광주시 수기동', type: '법정동', admin_parent: '충장동' },
    '장동': { lat: 35.1480, lon: 126.9150, name: '광주시 장동', type: '법정동', admin_parent: '충장동' },
    '충장로1가': { lat: 35.1480, lon: 126.9150, name: '광주시 충장로1가', type: '법정동', admin_parent: '충장동' },
    '충장로2가': { lat: 35.1480, lon: 126.9150, name: '광주시 충장로2가', type: '법정동', admin_parent: '충장동' },
    '충장로3가': { lat: 35.1480, lon: 126.9150, name: '광주시 충장로3가', type: '법정동', admin_parent: '충장동' },
    '충장로4가': { lat: 35.1480, lon: 126.9150, name: '광주시 충장로4가', type: '법정동', admin_parent: '충장동' },
    '충장로5가': { lat: 35.1480, lon: 126.9150, name: '광주시 충장로5가', type: '법정동', admin_parent: '충장동' },
    '황금동': { lat: 35.1480, lon: 126.9150, name: '광주시 황금동', type: '법정동', admin_parent: '충장동' },
    '남동': { lat: 35.1450, lon: 126.9100, name: '광주시 남동', type: '법정동', admin_parent: '서남동' },
    '서석동': { lat: 35.1450, lon: 126.9100, name: '광주시 서석동', type: '법정동', admin_parent: '서남동' },
    '소태동': { lat: 35.1300, lon: 126.9250, name: '광주시 소태동', type: '법정동', admin_parent: '지원1동' }, // 지원1동, 지원2동에 걸쳐있음
    '용산동': { lat: 35.1300, lon: 126.9250, name: '광주시 용산동', type: '법정동', admin_parent: '지원1동' },
    '운림동': { lat: 35.1300, lon: 126.9250, name: '광주시 운림동', type: '법정동', admin_parent: '지원1동' },
    '월남동': { lat: 35.1250, lon: 126.9300, name: '광주시 월남동', type: '법정동', admin_parent: '지원2동' },
    '내남동': { lat: 35.1250, lon: 126.9300, name: '광주시 내남동', type: '법정동', admin_parent: '지원2동' },


    // ===== 서구 (행정동 및 그에 속하는 법정동) =====
    '서구': { lat: 35.1519, lon: 126.8569, name: '광주시 서구', type: '기초자치단체' },
    '양동': { lat: 35.1480, lon: 126.9000, name: '광주시 서구 양동', type: '행정동', contains_legal_divisions: ['양동', '농성동', '벽진동'] },
    '농성1동': { lat: 35.1450, lon: 126.8900, name: '광주시 서구 농성1동', type: '행정동', contains_legal_divisions: ['농성동'] },
    '농성2동': { lat: 35.1420, lon: 126.8850, name: '광주시 서구 농성2동', type: '행정동', contains_legal_divisions: ['농성동'] },
    '광천동': { lat: 35.1500, lon: 126.8800, name: '광주시 서구 광천동', type: '행정동', contains_legal_divisions: ['광천동', '덕흥동'] },
    '유덕동': { lat: 35.1700, lon: 126.8500, name: '광주시 서구 유덕동', type: '행정동', contains_legal_divisions: ['유촌동', '덕흥동', '동림동', '동천동', '치평동'] }, // 치평동 중복되므로 법정동 항목은 해당 법정동의 주요 행정동으로 연결
    '치평동': { lat: 35.1500, lon: 126.8650, name: '광주시 서구 치평동', type: '행정동', contains_legal_divisions: ['치평동'] },
    '상무1동': { lat: 35.1450, lon: 126.8600, name: '광주시 서구 상무1동', type: '행정동', contains_legal_divisions: ['치평동', '마륵동'] },
    '상무2동': { lat: 35.1380, lon: 126.8600, name: '광주시 서구 상무2동', type: '행정동', contains_legal_divisions: ['치평동', '금호동'] },
    '화정1동': { lat: 35.1350, lon: 126.8700, name: '광주시 서구 화정1동', type: '행정동', contains_legal_divisions: ['화정동'] },
    '화정2동': { lat: 35.1320, lon: 126.8750, name: '광주시 서구 화정2동', type: '행정동', contains_legal_divisions: ['화정동'] },
    '화정3동': { lat: 35.1300, lon: 126.8800, name: '광주시 서구 화정3동', type: '행정동', contains_legal_divisions: ['화정동'] },
    '화정4동': { lat: 35.1280, lon: 126.8850, name: '광주시 서구 화정4동', type: '행정동', contains_legal_divisions: ['화정동'] },
    '풍암동': { lat: 35.1100, lon: 126.8650, name: '광주시 서구 풍암동', type: '행정동', contains_legal_divisions: ['풍암동'] },
    '금호1동': { lat: 35.1200, lon: 126.8500, name: '광주시 서구 금호1동', type: '행정동', contains_legal_divisions: ['금호동'] },
    '금호2동': { lat: 35.1150, lon: 126.8550, name: '광주시 서구 금호2동', type: '행정동', contains_legal_divisions: ['금호동'] },
    '서창동': { lat: 35.1000, lon: 126.8200, name: '광주시 서구 서창동', type: '행정동', contains_legal_divisions: ['벽진동', '세하동', '마륵동', '금호동', '매월동', '서창동', '용두동', '병풍동', '송대동', '풍암동'] }, // 일부 법정동은 서구 다른 행정동에도 포함됨
    '금당동': { lat: 35.1250, lon: 126.8400, name: '광주시 서구 금당동', type: '행정동', contains_legal_divisions: ['금당동'] },

    // 서구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '농성동': { lat: 35.1450, lon: 126.8900, name: '광주시 농성동', type: '법정동', admin_parent: '농성1동' }, // 양동에도 포함
    '벽진동': { lat: 35.1480, lon: 126.9000, name: '광주시 벽진동', type: '법정동', admin_parent: '양동' }, // 서창동에도 포함
    '덕흥동': { lat: 35.1500, lon: 126.8800, name: '광주시 덕흥동', type: '법정동', admin_parent: '광천동' }, // 유덕동에도 포함
    '유촌동': { lat: 35.1700, lon: 126.8500, name: '광주시 유촌동', type: '법정동', admin_parent: '유덕동' },
    '동림동_서구': { lat: 35.1700, lon: 126.8700, name: '광주시 동림동', type: '법정동', admin_parent: '유덕동' }, // 북구와 이름 중복 방지
    '동천동_서구': { lat: 35.1700, lon: 126.8500, name: '광주시 동천동', type: '법정동', admin_parent: '유덕동' }, // 북구와 이름 중복 방지
    '마륵동': { lat: 35.1450, lon: 126.8600, name: '광주시 마륵동', type: '법정동', admin_parent: '상무1동' }, // 서창동에도 포함
    '세하동': { lat: 35.1000, lon: 126.8200, name: '광주시 세하동', type: '법정동', admin_parent: '서창동' },
    '매월동': { lat: 35.1000, lon: 126.8200, name: '광주시 매월동', type: '법정동', admin_parent: '서창동' },
    '용두동_서구': { lat: 35.1000, lon: 126.8200, name: '광주시 용두동', type: '법정동', admin_parent: '서창동' }, // 북구와 이름 중복 방지
    '병풍동': { lat: 35.1000, lon: 126.8200, name: '광주시 병풍동', type: '법정동', admin_parent: '서창동' },
    '송대동': { lat: 35.1000, lon: 126.8200, name: '광주시 송대동', type: '법정동', admin_parent: '서창동' },


    // ===== 남구 (행정동 및 그에 속하는 법정동) =====
    '남구': { lat: 35.1118, lon: 126.9048, name: '광주시 남구', type: '기초자치단체' },
    '월산동': { lat: 35.1300, lon: 126.8900, name: '광주시 남구 월산동', type: '행정동', contains_legal_divisions: ['월산동', '주월동', '백운동'] },
    '월산4동': { lat: 35.1280, lon: 126.8950, name: '광주시 남구 월산4동', type: '행정동', contains_legal_divisions: ['월산동'] },
    '월산5동': { lat: 35.1250, lon: 126.9000, name: '광주시 남구 월산5동', type: '행정동', contains_legal_divisions: ['월산동'] },
    '백운1동': { lat: 35.1200, lon: 126.8950, name: '광주시 남구 백운1동', type: '행정동', contains_legal_divisions: ['백운동', '주월동'] },
    '백운2동': { lat: 35.1180, lon: 126.9000, name: '광주시 남구 백운2동', type: '행정동', contains_legal_divisions: ['백운동', '주월동'] },
    '주월1동': { lat: 35.1100, lon: 126.8950, name: '광주시 남구 주월1동', type: '행정동', contains_legal_divisions: ['주월동'] },
    '주월2동': { lat: 35.1050, lon: 126.8980, name: '광주시 남구 주월2동', type: '행정동', contains_legal_divisions: ['주월동'] },
    '효덕동': { lat: 35.1000, lon: 126.9100, name: '광주시 남구 효덕동', type: '행정동', contains_legal_divisions: ['봉선동', '진월동', '송암동', '노대동', '도금동', '압촌동', '칠석동'] },
    '봉선1동': { lat: 35.1050, lon: 126.9150, name: '광주시 남구 봉선1동', type: '행정동', contains_legal_divisions: ['봉선동'] },
    '봉선2동': { lat: 35.1000, lon: 126.9200, name: '광주시 남구 봉선2동', type: '행정동', contains_legal_divisions: ['봉선동'] },
    '송암동': { lat: 35.0900, lon: 126.8800, name: '광주시 남구 송암동', type: '행정동', contains_legal_divisions: ['송암동', '대지동', '양과동', '승촌동', '지석동', '석정동', '칠석동'] },
    '대촌동': { lat: 35.0500, lon: 126.8300, name: '광주시 남구 대촌동', type: '행정동', contains_legal_divisions: ['원산동', '구소동', '압촌동', '도금동', '칠석동', '월성동', '양촌동', '지석동'] },
    '진월동': { lat: 35.0950, lon: 126.8900, name: '광주시 남구 진월동', type: '행정동', contains_legal_divisions: ['진월동'] },
    '효천동': { lat: 35.0850, lon: 126.8950, name: '광주시 남구 효천동', type: '행정동', contains_legal_divisions: ['진월동', '노대동'] },
    '양림동': { lat: 35.1350, lon: 126.9100, name: '광주시 남구 양림동', type: '행정동', contains_legal_divisions: ['양림동'] },
    '방림1동': { lat: 35.1300, lon: 126.9100, name: '광주시 남구 방림1동', type: '행정동', contains_legal_divisions: ['방림동'] },
    '방림2동': { lat: 35.1280, lon: 126.9150, name: '광주시 남구 방림2동', type: '행정동', contains_legal_divisions: ['방림동'] },

    // 남구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '주월동': { lat: 35.1100, lon: 126.8950, name: '광주시 주월동', type: '법정동', admin_parent: '주월1동' }, // 월산동, 백운동에도 포함
    '백운동': { lat: 35.1200, lon: 126.8950, name: '광주시 백운동', type: '법정동', admin_parent: '백운1동' }, // 월산동에도 포함
    '노대동': { lat: 35.1000, lon: 126.9100, name: '광주시 노대동', type: '법정동', admin_parent: '효덕동' }, // 효천동에도 포함
    '도금동': { lat: 35.1000, lon: 126.9100, name: '광주시 도금동', type: '법정동', admin_parent: '효덕동' }, // 대촌동에도 포함
    '압촌동': { lat: 35.1000, lon: 126.9100, name: '광주시 압촌동', type: '법정동', admin_parent: '효덕동' }, // 대촌동에도 포함
    '칠석동': { lat: 35.1000, lon: 126.9100, name: '광주시 칠석동', type: '법정동', admin_parent: '효덕동' }, // 송암동, 대촌동에도 포함
    '대지동': { lat: 35.0900, lon: 126.8800, name: '광주시 대지동', type: '법정동', admin_parent: '송암동' },
    '양과동': { lat: 35.0900, lon: 126.8800, name: '광주시 양과동', type: '법정동', admin_parent: '송암동' },
    '승촌동': { lat: 35.0900, lon: 126.8800, name: '광주시 승촌동', type: '법정동', admin_parent: '송암동' },
    '지석동': { lat: 35.0900, lon: 126.8800, name: '광주시 지석동', type: '법정동', admin_parent: '송암동' }, // 대촌동에도 포함
    '석정동': { lat: 35.0900, lon: 126.8800, name: '광주시 석정동', type: '법정동', admin_parent: '송암동' },
    '원산동': { lat: 35.0500, lon: 126.8300, name: '광주시 원산동', type: '법정동', admin_parent: '대촌동' },
    '구소동': { lat: 35.0500, lon: 126.8300, name: '광주시 구소동', type: '법정동', admin_parent: '대촌동' },
    '월성동': { lat: 35.0500, lon: 126.8300, name: '광주시 월성동', type: '법정동', admin_parent: '대촌동' },
    '양촌동': { lat: 35.0500, lon: 126.8300, name: '광주시 양촌동', type: '법정동', admin_parent: '대촌동' },


    // ===== 북구 (행정동 및 그에 속하는 법정동) =====
    '북구': { lat: 35.1878, lon: 126.9118, name: '광주시 북구', type: '기초자치단체' },
    '중흥1동': { lat: 35.1680, lon: 126.9150, name: '광주시 북구 중흥1동', type: '행정동', contains_legal_divisions: ['중흥동'] },
    '중흥2동': { lat: 35.1700, lon: 126.9200, name: '광주시 북구 중흥2동', type: '행정동', contains_legal_divisions: ['중흥동'] },
    '중흥3동': { lat: 35.1650, lon: 126.9200, name: '광주시 북구 중흥3동', type: '행정동', contains_legal_divisions: ['중흥동'] },
    '중앙동': { lat: 35.1600, lon: 126.9100, name: '광주시 북구 중앙동', type: '행정동', contains_legal_divisions: ['누문동', '북동', '유동'] },
    '신안동': { lat: 35.1680, lon: 126.9050, name: '광주시 북구 신안동', type: '행정동', contains_legal_divisions: ['신안동'] },
    '운암1동': { lat: 35.1750, lon: 126.8850, name: '광주시 북구 운암1동', type: '행정동', contains_legal_divisions: ['운암동'] },
    '운암2동': { lat: 35.1780, lon: 126.8900, name: '광주시 북구 운암2동', type: '행정동', contains_legal_divisions: ['운암동'] },
    '운암3동': { lat: 35.1800, lon: 126.8950, name: '광주시 북구 운암3동', type: '행정동', contains_legal_divisions: ['운암동'] },
    '동림동': { lat: 35.1700, lon: 126.8700, name: '광주시 북구 동림동', type: '행정동', contains_legal_divisions: ['동림동'] },
    '운암4동': { lat: 35.1850, lon: 126.8850, name: '광주시 북구 운암4동', type: '행정동', contains_legal_divisions: ['운암동'] }, // 운암동 법정동으로 처리
    '용봉동': { lat: 35.1850, lon: 126.9000, name: '광주시 북구 용봉동', type: '행정동', contains_legal_divisions: ['용봉동'] },
    '오치1동': { lat: 35.1950, lon: 126.9050, name: '광주시 북구 오치1동', type: '행정동', contains_legal_divisions: ['오치동'] },
    '오치2동': { lat: 35.1980, lon: 126.9100, name: '광주시 북구 오치2동', type: '행정동', contains_legal_divisions: ['오치동'] },
    '문흥1동': { lat: 35.1900, lon: 126.9250, name: '광주시 북구 문흥1동', type: '행정동', contains_legal_divisions: ['문흥동'] },
    '문흥2동': { lat: 35.1950, lon: 126.9300, name: '광주시 북구 문흥2동', type: '행정동', contains_legal_divisions: ['문흥동'] },
    '두암1동': { lat: 35.1800, lon: 126.9300, name: '광주시 북구 두암1동', type: '행정동', contains_legal_divisions: ['두암동'] },
    '두암2동': { lat: 35.1850, lon: 126.9350, name: '광주시 북구 두암2동', type: '행정동', contains_legal_divisions: ['두암동'] },
    '각화동': { lat: 35.1900, lon: 126.9400, name: '광주시 북구 각화동', type: '행정동', contains_legal_divisions: ['각화동'] },
    '문화동': { lat: 35.1750, lon: 126.9250, name: '광주시 북구 문화동', type: '행정동', contains_legal_divisions: ['문화동'] },
    '임동': { lat: 35.1600, lon: 126.8900, name: '광주시 북구 임동', type: '행정동', contains_legal_divisions: ['임동'] },
    '본촌동': { lat: 35.2100, lon: 126.8900, name: '광주시 북구 본촌동', type: '행정동', contains_legal_divisions: ['본촌동', '양산동', '연제동'] },
    '일곡동': { lat: 35.2200, lon: 126.9000, name: '광주시 북구 일곡동', type: '행정동', contains_legal_divisions: ['일곡동'] },
    '매곡동': { lat: 35.2000, lon: 126.9000, name: '광주시 북구 매곡동', type: '행정동', contains_legal_divisions: ['매곡동', '오치동'] },
    '건국동': { lat: 35.2200, lon: 126.8700, name: '광주시 북구 건국동', type: '행정동', contains_legal_divisions: ['용두동', '지야동', '태령동', '대촌동', '오룡동', '월출동'] }, // 광산구와 일부 중복
    '첨단1동': { lat: 35.2300, lon: 126.8400, name: '광주시 북구 첨단1동', type: '행정동', contains_legal_divisions: ['월계동', '쌍암동'] },
    '첨단2동': { lat: 35.2250, lon: 126.8500, name: '광주시 북구 첨단2동', type: '행정동', contains_legal_divisions: ['월계동', '비아동', '수성동', '용두동', '연제동'] }, // 광산구와 일부 중복
    '신용동': { lat: 35.2100, lon: 126.8600, name: '광주시 북구 신용동', type: '행정동', contains_legal_divisions: ['신용동', '연제동', '양산동'] },
    '비아동': { lat: 35.2300, lon: 126.7900, name: '광주시 북구 비아동', type: '행정동', contains_legal_divisions: ['비아동', '도천동', '월계동', '첨단동'] }, // 광산구와 일부 중복

    // 북구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '중흥동': { lat: 35.1680, lon: 126.9180, name: '광주시 중흥동', type: '법정동', admin_parent: '중흥1동' }, // 2,3동에도 포함
    '누문동': { lat: 35.1600, lon: 126.9100, name: '광주시 누문동', type: '법정동', admin_parent: '중앙동' },
    '북동': { lat: 35.1600, lon: 126.9100, name: '광주시 북동', type: '법정동', admin_parent: '중앙동' },
    '유동': { lat: 35.1600, lon: 126.9100, name: '광주시 유동', type: '법정동', admin_parent: '중앙동' },
    '운암동': { lat: 35.1750, lon: 126.8850, name: '광주시 운암동', type: '법정동', admin_parent: '운암1동' }, // 2,3,4동에도 포함
    '오치동': { lat: 35.1950, lon: 126.9050, name: '광주시 오치동', type: '법정동', admin_parent: '오치1동' }, // 오치2동, 매곡동에도 포함
    '문흥동': { lat: 35.1900, lon: 126.9250, name: '광주시 문흥동', type: '법정동', admin_parent: '문흥1동' }, // 문흥2동에도 포함
    '두암동': { lat: 35.1800, lon: 126.9300, name: '광주시 두암동', type: '법정동', admin_parent: '두암1동' }, // 두암2동에도 포함
    '본촌동': { lat: 35.2100, lon: 126.8900, name: '광주시 본촌동', type: '법정동', admin_parent: '본촌동' },
    '양산동': { lat: 35.2100, lon: 126.8900, name: '광주시 양산동', type: '법정동', admin_parent: '본촌동' }, // 신용동에도 포함
    '연제동': { lat: 35.2100, lon: 126.8900, name: '광주시 연제동', type: '법정동', admin_parent: '본촌동' }, // 첨단2동, 신용동에도 포함
    '용두동_북구': { lat: 35.2200, lon: 126.8700, name: '광주시 용두동', type: '법정동', admin_parent: '건국동' }, // 서구, 광산구와 이름 중복 방지
    '지야동': { lat: 35.2200, lon: 126.8700, name: '광주시 지야동', type: '법정동', admin_parent: '건국동' },
    '태령동': { lat: 35.2200, lon: 126.8700, name: '광주시 태령동', type: '법정동', admin_parent: '건국동' },
    '대촌동_북구': { lat: 35.2200, lon: 126.8700, name: '광주시 대촌동', type: '법정동', admin_parent: '건국동' }, // 남구와 이름 중복 방지
    '오룡동': { lat: 35.2200, lon: 126.8700, name: '광주시 오룡동', type: '법정동', admin_parent: '건국동' },
    '월출동': { lat: 35.2200, lon: 126.8700, name: '광주시 월출동', type: '법정동', admin_parent: '건국동' },
    '월계동': { lat: 35.2300, lon: 126.8400, name: '광주시 월계동', type: '법정동', admin_parent: '첨단1동' }, // 첨단2동, 비아동에도 포함
    '쌍암동': { lat: 35.2300, lon: 126.8400, name: '광주시 쌍암동', type: '법정동', admin_parent: '첨단1동' },
    '수성동': { lat: 35.2250, lon: 126.8500, name: '광주시 수성동', type: '법정동', admin_parent: '첨단2동' },
    '도천동': { lat: 35.2300, lon: 126.7900, name: '광주시 도천동', type: '법정동', admin_parent: '비아동' },
    '첨단동': { lat: 35.2300, lon: 126.7900, name: '광주시 첨단동', type: '법정동', admin_parent: '비아동' },


    // ===== 광산구 (행정동 및 그에 속하는 법정동) =====
    '광산구': { lat: 35.1770, lon: 126.8041, name: '광주시 광산구', type: '기초자치단체' },
    '송정1동': { lat: 35.1480, lon: 126.7800, name: '광주시 광산구 송정1동', type: '행정동', contains_legal_divisions: ['송정동'] },
    '송정2동': { lat: 35.1450, lon: 126.7750, name: '광주시 광산구 송정2동', type: '행정동', contains_legal_divisions: ['송정동'] },
    '도산동': { lat: 35.1350, lon: 126.7700, name: '광주시 광산구 도산동', type: '행정동', contains_legal_divisions: ['도산동'] },
    '신흥동': { lat: 35.1250, lon: 126.7700, name: '광주시 광산구 신흥동', type: '행정동', contains_legal_divisions: ['신흥동'] },
    '어등산동': { lat: 35.1600, lon: 126.7800, name: '광주시 광산구 어등산동', type: '행정동', contains_legal_divisions: ['신촌동', '도덕동', '용봉동'] }, // 추정 법정동
    '동곡동': { lat: 35.1200, lon: 126.7200, name: '광주시 광산구 동곡동', type: '행정동', contains_legal_divisions: ['복룡동', '선계동', '요기동', '하산동'] },
    '평동': { lat: 35.1000, lon: 126.7200, name: '광주시 광산구 평동', type: '행정동', contains_legal_divisions: ['지정동', '장록동', '옥동', '월전동'] },
    '임곡동': { lat: 35.1800, lon: 126.6900, name: '광주시 광산구 임곡동', type: '행정동', contains_legal_divisions: ['등임동', '산막동', '신룡동', '연산동', '오산동'] },
    '본량동': { lat: 35.1500, lon: 126.6800, name: '광주시 광산구 본량동', type: '행정동', contains_legal_divisions: ['지산동', '명화동', '동호동', '남산동'] },
    '삼도동': { lat: 35.1200, lon: 126.7000, name: '광주시 광산구 삼도동', type: '행정동', contains_legal_divisions: ['도덕동', '용진동', '선동'] },
    '하남동': { lat: 35.1700, lon: 126.7900, name: '광주시 광산구 하남동', type: '행정동', contains_legal_divisions: ['하남동', '장덕동', '수완동'] },
    '첨단1동': { lat: 35.2100, lon: 126.8300, name: '광주시 광산구 첨단1동', type: '행정동', contains_legal_divisions: ['월계동', '쌍암동'] },
    '첨단2동': { lat: 35.2050, lon: 126.8400, name: '광주시 광산구 첨단2동', type: '행정동', contains_legal_divisions: ['월계동', '비아동', '수성동', '용두동', '연제동'] }, // 북구와 일부 중복될 수 있음
    '수완동': { lat: 35.1950, lon: 126.8200, name: '광주시 광산구 수완동', type: '행정동', contains_legal_divisions: ['수완동'] },
    '신가동': { lat: 35.1850, lon: 126.8150, name: '광주시 광산구 신가동', type: '행정동', contains_legal_divisions: ['신가동', '수완동', '운남동'] },
    '운남동': { lat: 35.1800, lon: 126.8050, name: '광주시 광산구 운남동', type: '행정동', contains_legal_divisions: ['운남동'] },
    '신창동': { lat: 35.2000, lon: 126.8000, name: '광주시 광산구 신창동', type: '행정동', contains_legal_divisions: ['신창동'] },
    '하남2지구동': { lat: 35.1650, lon: 126.7700, name: '광주시 광산구 하남2지구동', type: '행정동', contains_legal_divisions: ['하남동'] }, // 법정동 하남동
    '첨단3동': { lat: 35.2080, lon: 126.8150, name: '광주시 광산구 첨단3동', type: '행정동', contains_legal_divisions: ['첨단동', '수성동'] }, // 추정 법정동
    '진곡동': { lat: 35.1500, lon: 126.7500, name: '광주시 광산구 진곡동', type: '행정동', contains_legal_divisions: ['진곡동'] },
    '선암동': { lat: 35.1400, lon: 126.7600, name: '광주시 광산구 선암동', type: '행정동', contains_legal_divisions: ['선암동'] },

    // 광산구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '송정동': { lat: 35.1480, lon: 126.7800, name: '광주시 송정동', type: '법정동', admin_parent: '송정1동' }, // 송정2동에도 포함
    '신촌동': { lat: 35.1600, lon: 126.7800, name: '광주시 신촌동', type: '법정동', admin_parent: '어등산동' },
    '도덕동': { lat: 35.1600, lon: 126.7800, name: '광주시 도덕동', type: '법정동', admin_parent: '어등산동' }, // 삼도동에도 포함
    '용봉동_광산구': { lat: 35.1600, lon: 126.7800, name: '광주시 용봉동', type: '법정동', admin_parent: '어등산동' }, // 북구와 이름 중복 방지
    '복룡동': { lat: 35.1200, lon: 126.7200, name: '광주시 복룡동', type: '법정동', admin_parent: '동곡동' },
    '선계동': { lat: 35.1200, lon: 126.7200, name: '광주시 선계동', type: '법정동', admin_parent: '동곡동' },
    '요기동': { lat: 35.1200, lon: 126.7200, name: '광주시 요기동', type: '법정동', admin_parent: '동곡동' },
    '하산동': { lat: 35.1200, lon: 126.7200, name: '광주시 하산동', type: '법정동', admin_parent: '동곡동' },
    '지정동': { lat: 35.1000, lon: 126.7200, name: '광주시 지정동', type: '법정동', admin_parent: '평동' },
    '장록동': { lat: 35.1000, lon: 126.7200, name: '광주시 장록동', type: '법정동', admin_parent: '평동' },
    '옥동': { lat: 35.1000, lon: 126.7200, name: '광주시 옥동', type: '법정동', admin_parent: '평동' },
    '월전동': { lat: 35.1000, lon: 126.7200, name: '광주시 월전동', type: '법정동', admin_parent: '평동' },
    '등임동': { lat: 35.1800, lon: 126.6900, name: '광주시 등임동', type: '법정동', admin_parent: '임곡동' },
    '산막동': { lat: 35.1800, lon: 126.6900, name: '광주시 산막동', type: '법정동', admin_parent: '임곡동' },
    '신룡동': { lat: 35.1800, lon: 126.6900, name: '광주시 신룡동', type: '법정동', admin_parent: '임곡동' },
    '연산동': { lat: 35.1800, lon: 126.6900, name: '광주시 연산동', type: '법정동', admin_parent: '임곡동' },
    '오산동': { lat: 35.1800, lon: 126.6900, name: '광주시 오산동', type: '법정동', admin_parent: '임곡동' },
    '지산동_광산구': { lat: 35.1500, lon: 126.6800, name: '광주시 지산동', type: '법정동', admin_parent: '본량동' }, // 동구와 이름 중복 방지
    '명화동': { lat: 35.1500, lon: 126.6800, name: '광주시 명화동', type: '법정동', admin_parent: '본량동' },
    '동호동': { lat: 35.1500, lon: 126.6800, name: '광주시 동호동', type: '법정동', admin_parent: '본량동' },
    '남산동_광산구': { lat: 35.1500, lon: 126.6800, name: '광주시 남산동', type: '법정동', admin_parent: '본량동' }, // 남구와 이름 중복 방지
    '용진동': { lat: 35.1200, lon: 126.7000, name: '광주시 용진동', type: '법정동', admin_parent: '삼도동' },
    '선동': { lat: 35.1200, lon: 126.7000, name: '광주시 선동', type: '법정동', admin_parent: '삼도동' },
    '하남동': { lat: 35.1700, lon: 126.7900, name: '광주시 하남동', type: '법정동', admin_parent: '하남동' }, // 하남2지구동에도 포함
    '장덕동': { lat: 35.1700, lon: 126.7900, name: '광주시 장덕동', type: '법정동', admin_parent: '하남동' },
    '수완동': { lat: 35.1950, lon: 126.8200, name: '광주시 수완동', type: '법정동', admin_parent: '수완동' }, // 하남동, 신가동에도 포함
    '신가동': { lat: 35.1850, lon: 126.8150, name: '광주시 신가동', type: '법정동', admin_parent: '신가동' },
    '운남동': { lat: 35.1800, lon: 126.8050, name: '광주시 운남동', type: '법정동', admin_parent: '운남동' },
    '신창동': { lat: 35.2000, lon: 126.8000, name: '광주시 신창동', type: '법정동', admin_parent: '신창동' },
    '첨단동': { lat: 35.2080, lon: 126.8150, name: '광주시 첨단동', type: '법정동', admin_parent: '첨단3동' }, // 비아동에도 포함
    '진곡동': { lat: 35.1500, lon: 126.7500, name: '광주시 진곡동', type: '법정동', admin_parent: '진곡동' },
    '선암동': { lat: 35.1400, lon: 126.7600, name: '광주시 선암동', type: '법정동', admin_parent: '선암동' },




  
  


   '울산': { lat: 35.5398, lon: 129.3175, name: '울산시', type: '광역자치단체', aliases: ['울산광역시', '울산'] },
    '울산시': { lat: 35.5398, lon: 129.3175, name: '울산시', type: '광역자치단체', aliases: ['울산광역시', '울산'] }, // 사용자의 요청에 따라 추가된 항목

    // ===== 중구 (행정동 및 그에 속하는 법정동) =====
    '중구': { lat: 35.5501, lon: 129.3130, name: '울산시 중구', type: '기초자치단체' },
    '학성동': { lat: 35.5600, lon: 129.3200, name: '울산시 중구 학성동', type: '행정동', contains_legal_divisions: ['학성동'] },
    '복산1동': { lat: 35.5650, lon: 129.3250, name: '울산시 중구 복산1동', type: '행정동', contains_legal_divisions: ['복산동', '학성동'] }, // 복산동 일부 포함
    '복산2동': { lat: 35.5680, lon: 129.3300, name: '울산시 중구 복산2동', type: '행정동', contains_legal_divisions: ['복산동'] },
    '성남동': { lat: 35.5550, lon: 129.3100, name: '울산시 중구 성남동', type: '행정동', contains_legal_divisions: ['성남동', '옥교동', '학산동'] },
    '우정동': { lat: 35.5550, lon: 129.3000, name: '울산시 중구 우정동', type: '행정동', contains_legal_divisions: ['우정동'] },
    '태화동': { lat: 35.5500, lon: 129.2950, name: '울산시 중구 태화동', type: '행정동', contains_legal_divisions: ['태화동'] },
    '다운동': { lat: 35.5650, lon: 129.2700, name: '울산시 중구 다운동', type: '행정동', contains_legal_divisions: ['다운동'] },
    '병영1동': { lat: 35.5700, lon: 129.3400, name: '울산시 중구 병영1동', type: '행정동', contains_legal_divisions: ['남외동', '진장동'] }, // 남외동, 진장동 일부 포함
    '병영2동': { lat: 35.5750, lon: 129.3450, name: '울산시 중구 병영2동', type: '행정동', contains_legal_divisions: ['약사동', '진장동', '서동'] }, // 약사동, 진장동, 서동 일부 포함
    '혁신동': { lat: 35.5580, lon: 129.3350, name: '울산시 중구 혁신동', type: '행정동', contains_legal_divisions: ['유곡동'] }, // 유곡동 일부 포함
    '반구1동': { lat: 35.5600, lon: 129.3050, name: '울산시 중구 반구1동', type: '행정동', contains_legal_divisions: ['반구동'] },
    '반구2동': { lat: 35.5630, lon: 129.3100, name: '울산시 중구 반구2동', type: '행정동', contains_legal_divisions: ['반구동'] },

    // 중구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // Note: Legal divisions are listed with their full official name.
    '복산동': { lat: 35.5650, lon: 129.3250, name: '울산시 복산동', type: '법정동', admin_parent: '복산1동' }, // As '복산1동' has '복산동' in legal_divisions
    '옥교동': { lat: 35.5550, lon: 129.3100, name: '울산시 옥교동', type: '법정동', admin_parent: '성남동' },
    '학산동': { lat: 35.5550, lon: 129.3100, name: '울산시 학산동', type: '법정동', admin_parent: '성남동' },
    '남외동': { lat: 35.5700, lon: 129.3400, name: '울산시 남외동', type: '법정동', admin_parent: '병영1동' },
    '진장동': { lat: 35.5700, lon: 129.3400, name: '울산시 진장동', type: '법정동', admin_parent: '병영1동' },
    '약사동': { lat: 35.5750, lon: 129.3450, name: '울산시 약사동', type: '법정동', admin_parent: '병영2동' },
    '서동': { lat: 35.5750, lon: 129.3450, name: '울산시 서동', type: '법정동', admin_parent: '병영2동' },
    '유곡동': { lat: 35.5580, lon: 129.3350, name: '울산시 유곡동', type: '법정동', admin_parent: '혁신동' },


    // ===== 남구 (행정동 및 그에 속하는 법정동) =====
    '남구': { lat: 35.5398, lon: 129.3090, name: '울산시 남구', type: '기초자치단체' },
    '신정1동': { lat: 35.5450, lon: 129.3100, name: '울산시 남구 신정1동', type: '행정동', contains_legal_divisions: ['신정동'] },
    '신정2동': { lat: 35.5400, lon: 129.3050, name: '울산시 남구 신정2동', type: '행정동', contains_legal_divisions: ['신정동'] },
    '신정3동': { lat: 35.5350, lon: 129.3100, name: '울산시 남구 신정3동', type: '행정동', contains_legal_divisions: ['신정동'] },
    '신정4동': { lat: 35.5300, lon: 129.3050, name: '울산시 남구 신정4동', type: '행정동', contains_legal_divisions: ['신정동'] },
    '신정5동': { lat: 35.5480, lon: 129.3150, name: '울산시 남구 신정5동', type: '행정동', contains_legal_divisions: ['신정동'] },
    '삼산동': { lat: 35.5380, lon: 129.3380, name: '울산시 남구 삼산동', type: '행정동', contains_legal_divisions: ['삼산동'] },
    '달동': { lat: 35.5300, lon: 129.3300, name: '울산시 남구 달동', type: '행정동', contains_legal_divisions: ['달동'] },
    '야음장생포동': { lat: 35.5100, lon: 129.3200, name: '울산시 남구 야음장생포동', type: '행정동', contains_legal_divisions: ['야음동', '장생포동', '매암동', '용잠동', '황성동'] },
    '선암동': { lat: 35.4950, lon: 129.3100, name: '울산시 남구 선암동', type: '행정동', contains_legal_divisions: ['선암동', '상개동', '부곡동'] },
    '수암동': { lat: 35.5200, lon: 129.3050, name: '울산시 남구 수암동', type: '행정동', contains_legal_divisions: ['수암동', '야음동'] },
    '대현동': { lat: 35.5150, lon: 129.3150, name: '울산시 남구 대현동', type: '행정동', contains_legal_divisions: ['대현동', '야음동'] },
    '무거동': { lat: 35.5300, lon: 129.2800, name: '울산시 남구 무거동', type: '행정동', contains_legal_divisions: ['무거동'] },
    '옥동': { lat: 35.5250, lon: 129.2900, name: '울산시 남구 옥동', type: '행정동', contains_legal_divisions: ['옥동'] },
    '삼호동': { lat: 35.5400, lon: 129.2900, name: '울산시 남구 삼호동', type: '행정동', contains_legal_divisions: ['삼호동'] },

    // 남구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '야음동': { lat: 35.5100, lon: 129.3200, name: '울산시 야음동', type: '법정동', admin_parent: '야음장생포동' },
    '장생포동': { lat: 35.5100, lon: 129.3200, name: '울산시 장생포동', type: '법정동', admin_parent: '야음장생포동' },
    '매암동': { lat: 35.5100, lon: 129.3200, name: '울산시 매암동', type: '법정동', admin_parent: '야음장생포동' },
    '용잠동': { lat: 35.5100, lon: 129.3200, name: '울산시 용잠동', type: '법정동', admin_parent: '야음장생포동' },
    '황성동': { lat: 35.5100, lon: 129.3200, name: '울산시 황성동', type: '법정동', admin_parent: '야음장생포동' },
    '상개동': { lat: 35.4950, lon: 129.3100, name: '울산시 상개동', type: '법정동', admin_parent: '선암동' },
    '부곡동': { lat: 35.4950, lon: 129.3100, name: '울산시 부곡동', type: '법정동', admin_parent: '선암동' },


    // ===== 동구 (행정동 및 그에 속하는 법정동) =====
    '동구': { lat: 35.4988, lon: 129.4184, name: '울산시 동구', type: '기초자치단체' },
    '방어동': { lat: 35.4700, lon: 129.3900, name: '울산시 동구 방어동', type: '행정동', contains_legal_divisions: ['방어동'] },
    '일산동': { lat: 35.4800, lon: 129.4100, name: '울산시 동구 일산동', type: '행정동', contains_legal_divisions: ['일산동'] },
    '전하1동': { lat: 35.4900, lon: 129.4000, name: '울산시 동구 전하1동', type: '행정동', contains_legal_divisions: ['전하동'] },
    '전하2동': { lat: 35.4950, lon: 129.4050, name: '울산시 동구 전하2동', type: '행정동', contains_legal_divisions: ['전하동'] },
    '남목1동': { lat: 35.5200, lon: 129.4200, name: '울산시 동구 남목1동', type: '행정동', contains_legal_divisions: ['남목동'] },
    '남목2동': { lat: 35.5250, lon: 129.4250, name: '울산시 동구 남목2동', type: '행정동', contains_legal_divisions: ['남목동'] },
    '남목3동': { lat: 35.5300, lon: 129.4300, name: '울산시 동구 남목3동', type: '행정동', contains_legal_divisions: ['남목동'] },
    '대송동': { lat: 35.5050, lon: 129.4100, name: '울산시 동구 대송동', type: '행정동', contains_legal_divisions: ['대송동'] },
    '화정동': { lat: 35.5000, lon: 129.4150, name: '울산시 동구 화정동', type: '행정동', contains_legal_divisions: ['화정동'] },

    // 동구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    // 현재 동구에는 행정동과 이름이 다른 법정동이 없어 추가할 항목이 없습니다.


    // ===== 북구 (행정동 및 그에 속하는 법정동) =====
    '북구': { lat: 35.5898, lon: 129.3512, name: '울산시 북구', type: '기초자치단체' },
    '농소1동': { lat: 35.6100, lon: 129.3400, name: '울산시 북구 농소1동', type: '행정동', contains_legal_divisions: ['창평동', '호계동', '매곡동'] },
    '농소2동': { lat: 35.6200, lon: 129.3500, name: '울산시 북구 농소2동', type: '행정동', contains_legal_divisions: ['신천동'] },
    '농소3동': { lat: 35.6300, lon: 129.3600, name: '울산시 북구 농소3동', type: '행정동', contains_legal_divisions: ['가대동', '달천동', '상안동'] },
    '강동동': { lat: 35.6400, lon: 129.4500, name: '울산시 북구 강동동', type: '행정동', contains_legal_divisions: ['구유동', '당사동', '대안동', '정자동', '강동동', '신명동', '어물동'] },
    '효문동': { lat: 35.5700, lon: 129.3800, name: '울산시 북구 효문동', type: '행정동', contains_legal_divisions: ['효문동', '연암동', '신천동'] },
    '송정동': { lat: 35.5800, lon: 129.3700, name: '울산시 북구 송정동', type: '행정동', contains_legal_divisions: ['송정동'] },
    '양정동': { lat: 35.5750, lon: 129.3600, name: '울산시 북구 양정동', type: '행정동', contains_legal_divisions: ['양정동'] },
    '염포동': { lat: 35.5550, lon: 129.3700, name: '울산시 북구 염포동', type: '행정동', contains_legal_divisions: ['염포동'] },

    // 북구 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '창평동': { lat: 35.6100, lon: 129.3400, name: '울산시 창평동', type: '법정동', admin_parent: '농소1동' },
    '호계동': { lat: 35.6100, lon: 129.3400, name: '울산시 호계동', type: '법정동', admin_parent: '농소1동' },
    '매곡동': { lat: 35.6100, lon: 129.3400, name: '울산시 매곡동', type: '법정동', admin_parent: '농소1동' },
    '신천동': { lat: 35.6200, lon: 129.3500, name: '울산시 신천동', type: '법정동', admin_parent: '농소2동' },
    '가대동': { lat: 35.6300, lon: 129.3600, name: '울산시 가대동', type: '법정동', admin_parent: '농소3동' },
    '달천동': { lat: 35.6300, lon: 129.3600, name: '울산시 달천동', type: '법정동', admin_parent: '농소3동' },
    '상안동': { lat: 35.6300, lon: 129.3600, name: '울산시 상안동', type: '법정동', admin_parent: '농소3동' },
    '구유동': { lat: 35.6400, lon: 129.4500, name: '울산시 구유동', type: '법정동', admin_parent: '강동동' },
    '당사동': { lat: 35.6400, lon: 129.4500, name: '울산시 당사동', type: '법정동', admin_parent: '강동동' },
    '대안동': { lat: 35.6400, lon: 129.4500, name: '울산시 대안동', type: '법정동', admin_parent: '강동동' },
    '정자동': { lat: 35.6400, lon: 129.4500, name: '울산시 정자동', type: '법정동', admin_parent: '강동동' },
    '신명동': { lat: 35.6400, lon: 129.4500, name: '울산시 신명동', type: '법정동', admin_parent: '강동동' },
    '어물동': { lat: 35.6400, lon: 129.4500, name: '울산시 어물동', type: '법정동', admin_parent: '강동동' },
    '연암동': { lat: 35.5700, lon: 129.3800, name: '울산시 연암동', type: '법정동', admin_parent: '효문동' },


    // ===== 울주군 (행정동 및 그에 속하는 법정리) =====
    '울주군': { lat: 35.5160, lon: 129.1170, name: '울산시 울주군', type: '기초자치단체' },
    '온산읍': { lat: 35.4700, lon: 129.2800, name: '울산시 울주군 온산읍', type: '읍', contains_legal_divisions: ['방도리', '산암리', '화산리', '덕신리', '망양리', '원산리', '이진리', '온산리', '강양리'] },
    '온양읍': { lat: 35.4300, lon: 129.2500, name: '울산시 울주군 온양읍', type: '읍', contains_legal_divisions: ['남창리', '동상리', '발리', '삼광리', '운화리', '외광리', '고산리', '대안리', '내광리'] },
    '범서읍': { lat: 35.5500, lon: 129.2000, name: '울산시 울주군 범서읍', type: '읍', contains_legal_divisions: ['천상리', '구영리', '굴화리', '선바위', '입암리', '사연리', '망성리', '길촌리', '서사리', '척과리'] },
    '언양읍': { lat: 35.5600, lon: 129.1000, name: '울산시 울주군 언양읍', type: '읍', contains_legal_divisions: ['남부리', '동부리', '서부리', '북부리', '반송리', '반천리', '반곡리', '구수리', '태기리', '대곡리', '어음리', '직동리'] },
    '청량읍': { lat: 35.4800, lon: 129.2300, name: '울산시 울주군 청량읍', type: '읍', contains_legal_divisions: ['율리', '문수리', '삼정리', '용암리', '중리', '상남리', '하남리'] },
    '서생면': { lat: 35.3700, lon: 129.2900, name: '울산시 울주군 서생면', type: '면', contains_legal_divisions: ['대송리', '명산리', '용리', '신암리', '진하리', '화산리', '나사리', '서생리'] },
    '웅촌면': { lat: 35.4600, lon: 129.1600, name: '울산시 울주군 웅촌면', type: '면', contains_legal_divisions: ['고연리', '대대리', '석천리', '통천리', '은현리', '곡천리', '검단리', '초천리'] },
    '두동면': { lat: 35.6100, lon: 129.2000, name: '울산시 울주군 두동면', type: '면', contains_legal_divisions: ['봉계리', '은편리', '천곡리', '삼정리', '구미리', '대곡리', '이전리', '지등리'] },
    '두서면': { lat: 35.6600, lon: 129.1500, name: '울산시 울주군 두서면', type: '면', contains_legal_divisions: ['활천리', '미호리', '인보리', '서하리', '내와리', '복안리', '차리'] },
    '상북면': { lat: 35.6000, lon: 129.0500, name: '울산시 울주군 상북면', type: '면', contains_legal_divisions: ['산전리', '궁근정리', '양등리', '향산리', '덕현리', '이천리', '길천리', '등억리'] },
    '삼남읍': { lat: 35.5000, lon: 129.1000, name: '울산시 울주군 삼남읍', type: '읍', contains_legal_divisions: ['교동리', '가천리', '상천리', '하천리', '방기리', '작천리', '울산역로'] },
    '삼동면': { lat: 35.5000, lon: 129.0000, name: '울산시 울주군 삼동면', type: '면', contains_legal_divisions: ['보삼리', '둔기리', '금곡리', '하잠리'] },




  

  
   '세종': { lat: 36.4800, lon: 127.2890, name: '세종시', type: '광역자치단체', aliases: ['세종특별자치시', '세종'] },

    // ===== 세종시 (행정동 및 그에 속하는 법정동/리) =====
    // 행정동 (읍, 면 포함)
    '한솔동': { lat: 36.4840, lon: 127.2790, name: '세종시 한솔동', type: '행정동', contains_legal_divisions: ['한솔동'] },
    '도담동': { lat: 36.5050, lon: 127.2850, name: '세종시 도담동', type: '행정동', contains_legal_divisions: ['도담동', '어진동', '방축동'] },
    '아름동': { lat: 36.5130, lon: 127.2800, name: '세종시 아름동', type: '행정동', contains_legal_divisions: ['아름동'] },
    '종촌동': { lat: 36.5030, lon: 127.2700, name: '세종시 종촌동', type: '행정동', contains_legal_divisions: ['종촌동'] },
    '고운동': { lat: 36.5180, lon: 127.2600, name: '세종시 고운동', type: '행정동', contains_legal_divisions: ['고운동'] },
    '새롬동': { lat: 36.4750, lon: 127.2700, name: '세종시 새롬동', type: '행정동', contains_legal_divisions: ['새롬동'] },
    '다정동': { lat: 36.4800, lon: 127.2650, name: '세종시 다정동', type: '행정동', contains_legal_divisions: ['다정동'] },
    '대평동': { lat: 36.4700, lon: 127.2850, name: '세종시 대평동', type: '행정동', contains_legal_divisions: ['대평동'] },
    '보람동': { lat: 36.4650, lon: 127.2950, name: '세종시 보람동', type: '행정동', contains_legal_divisions: ['보람동'] },
    '소담동': { lat: 36.4550, lon: 127.3000, name: '세종시 소담동', type: '행정동', contains_legal_divisions: ['소담동', '집현동'] },
    '반곡동': { lat: 36.4600, lon: 127.3100, name: '세종시 반곡동', type: '행정동', contains_legal_divisions: ['반곡동', '집현동'] },
    '조치원읍': { lat: 36.6020, lon: 127.3060, name: '세종시 조치원읍', type: '읍', contains_legal_divisions: ['원리', '교리', '정리', '평리', '상리', '남리', '번암리', '신흥리', '죽림리', '봉산리', '서창리', '침산리'] },
    '연기면': { lat: 36.5000, lon: 127.2200, name: '세종시 연기면', type: '면', contains_legal_divisions: ['보통리', '산울리', '세종리', '연기리', '연화리'] },
    '연동면': { lat: 36.4800, lon: 127.3400, name: '세종시 연동면', type: '면', contains_legal_divisions: ['내판리', '노송리', '예양리', '응암리', '송용리', '합강리'] },
    '부강면': { lat: 36.4400, lon: 127.3600, name: '세종시 부강면', type: '면', contains_legal_divisions: ['부강리', '갈산리', '산수리', '등곡리', '노호리', '문곡리', '금호리', '행산리', '상수리'] },
    '금남면': { lat: 36.4200, lon: 127.2500, name: '세종시 금남면', type: '면', contains_legal_divisions: ['성덕리', '도남리', '용포리', '발산리', '영대리', '장재리', '두만리', '황용리', '감성리', '박산리', '축산리', '대박리', '신촌리', '금천리', '부용리'] },
    '장군면': { lat: 36.4500, lon: 127.1800, name: '세종시 장군면', type: '면', contains_legal_divisions: ['산학리', '송문리', '봉안리', '평기리', '대교리', '금암리', '하봉리', '용암리', '송학리'] },
    '연서면': { lat: 36.5500, lon: 127.2600, name: '세종시 연서면', type: '면', contains_legal_divisions: ['봉암리', '고복리', '용암리', '쌍류리', '와촌리', '국촌리', '부동리', '성대리', '신대리', '청라리'] },
    '전의면': { lat: 36.6400, lon: 127.2400, name: '세종시 전의면', type: '면', contains_legal_divisions: ['동교리', '양곡리', '유천리', '읍내리', '원성리', '신방리', '관정리', '노장리', '다방리', '달전리', '소정리', '흥성리'] },
    '전동면': { lat: 36.6300, lon: 127.3300, name: '세종시 전동면', type: '면', contains_legal_divisions: ['노장리', '청송리', '보덕리', '미곡리', '송성리', '석곡리', '심중리', '금사리'] },
    '소정면': { lat: 36.6600, lon: 127.2000, name: '세종시 소정면', type: '면', contains_legal_divisions: ['소정리', '운당리', '고등리', '대곡리'] },
    '해밀동': { lat: 36.5300, lon: 127.2700, name: '세종시 해밀동', type: '행정동', contains_legal_divisions: ['해밀동'] },
    '산울동': { lat: 36.5250, lon: 127.2900, name: '세종시 산울동', type: '행정동', contains_legal_divisions: ['산울동'] },

    // 법정동 (행정동과 이름이 다른 경우만 개별 항목으로 포함)
    '어진동': { lat: 36.5050, lon: 127.2850, name: '세종시 어진동', type: '법정동', admin_parent: '도담동' },
    '방축동': { lat: 36.5050, lon: 127.2850, name: '세종시 방축동', type: '법정동', admin_parent: '도담동' },
    '집현동': { lat: 36.4550, lon: 127.3000, name: '세종시 집현동', type: '법정동', admin_parent: '소담동' }, // 소담동/반곡동에 걸쳐있음. 대표좌표는 소담동
  


    '제주': { lat: 33.4996, lon: 126.5312, name: '제주특별자치시', type: '광역자치단체' },

    // ===== 제주시 (행정동 및 그에 속하는 법정동/리) =====
    '제주시': { lat: 33.5074, lon: 126.5178, name: '제주특별자치시 제주시', type: '기초자치단체' },

    // 제주시 행정동
    '일도1동': { lat: 33.5130, lon: 126.5270, name: '제주특별자치시 제주시 일도1동', type: '행정동', contains_legal_divisions: ['일도일동'] },
    '일도2동': { lat: 33.5100, lon: 126.5300, name: '제주특별자치시 제주시 일도2동', type: '행정동', contains_legal_divisions: ['일도이동'] },
    '이도1동': { lat: 33.5070, lon: 126.5200, name: '제주특별자치시 제주시 이도1동', type: '행정동', contains_legal_divisions: ['이도일동'] },
    '이도2동': { lat: 33.5050, lon: 126.5250, name: '제주특별자치시 제주시 이도2동', type: '행정동', contains_legal_divisions: ['이도이동', '도남동'] },
    '삼도1동': { lat: 33.5100, lon: 126.5150, name: '제주특별자치시 제주시 삼도1동', type: '행정동', contains_legal_divisions: ['삼도일동'] },
    '삼도2동': { lat: 33.5080, lon: 126.5100, name: '제주특별자치시 제주시 삼도2동', type: '행정동', contains_legal_divisions: ['삼도이동'] },
    '건입동': { lat: 33.5150, lon: 126.5350, name: '제주특별자치시 제주시 건입동', type: '행정동', contains_legal_divisions: ['건입동'] },
    '화북동': { lat: 33.5200, lon: 126.5700, name: '제주특별자치시 제주시 화북동', type: '행정동', contains_legal_divisions: ['화북일동', '화북이동'] },
    '삼양동': { lat: 33.5250, lon: 126.6000, name: '제주특별자치시 제주시 삼양동', type: '행정동', contains_legal_divisions: ['삼양일동', '삼양이동', '삼양삼동'] },
    '봉개동': { lat: 33.4600, lon: 126.6200, name: '제주특별자치시 제주시 봉개동', type: '행정동', contains_legal_divisions: ['봉개동'] },
    '아라동': { lat: 33.4650, lon: 126.5500, name: '제주특별자치시 제주시 아라동', type: '행정동', contains_legal_divisions: ['아라일동', '아라이동', '영평동', '오등동'] },
    '오라동': { lat: 33.4700, lon: 126.5000, name: '제주특별자치시 제주시 오라동', type: '행정동', contains_legal_divisions: ['오라일동', '오라이동', '오라삼동'] },
    '연동': { lat: 33.4900, lon: 126.4900, name: '제주특별자치시 제주시 연동', type: '행정동', contains_legal_divisions: ['연동'] },
    '노형동': { lat: 33.4850, lon: 126.4700, name: '제주특별자치시 제주시 노형동', type: '행정동', contains_legal_divisions: ['노형동'] },
    '외도동': { lat: 33.5050, lon: 126.4500, name: '제주특별자치시 제주시 외도동', type: '행정동', contains_legal_divisions: ['외도일동', '외도이동', '외도삼동'] },
    '이호동': { lat: 33.5150, lon: 126.4700, name: '제주특별자치시 제주시 이호동', type: '행정동', contains_legal_divisions: ['이호일동', '이호이동'] },
    '도두동': { lat: 33.5200, lon: 126.4300, name: '제주특별자치시 제주시 도두동', type: '행정동', contains_legal_divisions: ['도두일동', '도두이동'] },
    '추자면': { lat: 33.9500, lon: 126.3200, name: '제주특별자치시 제주시 추자면', type: '면', contains_legal_divisions: ['대서리', '묵리', '신양리', '영흥리', '예초리'] },
    '한경면': { lat: 33.3200, lon: 126.1700, name: '제주특별자치시 제주시 한경면', type: '면', contains_legal_divisions: ['고산리', '금등리', '낙천리', '두모리', '신창리', '용수리', '저지리', '조수리', '청수리', '판포리'] },
    '한림읍': { lat: 33.4100, lon: 126.2600, name: '제주특별자치시 제주시 한림읍', type: '읍', contains_legal_divisions: ['귀덕리', '금능리', '금악리', '대림리', '동명리', '명월리', '상대리', '상명리', '수원리', '옹포리', '월령리', '월림리', '한림리', '한수리', '협재리'] },
    '애월읍': { lat: 33.4600, lon: 126.3300, name: '제주특별자치시 제주시 애월읍', type: '읍', contains_legal_divisions: ['고내리', '고성리', '곽지리', '광령리', '구엄리', '금성리', '납읍리', '봉성리', '상가리', '상귀리', '소길리', '수산리', '애월리', '어음리', '신엄리', '유수암리'] },
    '구좌읍': { lat: 33.5100, lon: 126.7500, name: '제주특별자치시 제주시 구좌읍', type: '읍', contains_legal_divisions: ['김녕리', '덕천리', '동복리', '상도리', '세화리', '송당리', '월정리', '종달리', '평대리', '하도리', '한동리', '행원리'] },
    '조천읍': { lat: 33.5300, lon: 126.6600, name: '제주특별자치시 제주시 조천읍', type: '읍', contains_legal_divisions: ['교래리', '대흘리', '북촌리', '선흘리', '신촌리', '신흥리', '와산리', '와흘리', '조천리', '함덕리'] },
    '우도면': { lat: 33.5130, lon: 126.9460, name: '제주특별자치시 제주시 우도면', type: '면', contains_legal_divisions: ['연평리'] }, // 우도면 추가

    // 제주시 법정동/리 (해당 행정동의 좌표 재사용)
    '일도일동': { lat: 33.5130, lon: 126.5270, name: '제주특별자치시 제주시 일도일동', type: '법정동', admin_parent: '일도1동' },
    '일도이동': { lat: 33.5100, lon: 126.5300, name: '제주특별자치시 제주시 일도이동', type: '법정동', admin_parent: '일도2동' },
    '이도일동': { lat: 33.5070, lon: 126.5200, name: '제주특별자치시 제주시 이도일동', type: '법정동', admin_parent: '이도1동' },
    '이도이동': { lat: 33.5050, lon: 126.5250, name: '제주특별자치시 제주시 이도이동', type: '법정동', admin_parent: '이도2동' },
    '도남동': { lat: 33.5050, lon: 126.5250, name: '제주특별자치시 제주시 도남동', type: '법정동', admin_parent: '이도2동' },
    '삼도일동': { lat: 33.5100, lon: 126.5150, name: '제주특별자치시 제주시 삼도일동', type: '법정동', admin_parent: '삼도1동' },
    '삼도이동': { lat: 33.5080, lon: 126.5100, name: '제주특별자치시 제주시 삼도이동', type: '법정동', admin_parent: '삼도2동' },
    '건입동_법정': { lat: 33.5150, lon: 126.5350, name: '제주특별자치시 제주시 건입동', type: '법정동', admin_parent: '건입동' }, // 법정동과 행정동 이름이 같아 구분
    '화북일동': { lat: 33.5200, lon: 126.5700, name: '제주특별자치시 제주시 화북일동', type: '법정동', admin_parent: '화북동' },
    '화북이동': { lat: 33.5200, lon: 126.5700, name: '제주특별자치시 제주시 화북이동', type: '법정동', admin_parent: '화북동' },
    '삼양일동': { lat: 33.5250, lon: 126.6000, name: '제주특별자치시 제주시 삼양일동', type: '법정동', admin_parent: '삼양동' },
    '삼양이동': { lat: 33.5250, lon: 126.6000, name: '제주특별자치시 제주시 삼양이동', type: '법정동', admin_parent: '삼양동' },
    '삼양삼동': { lat: 33.5250, lon: 126.6000, name: '제주특별자치시 제주시 삼양삼동', type: '법정동', admin_parent: '삼양동' },
    '봉개동_법정': { lat: 33.4600, lon: 126.6200, name: '제주특별자치시 제주시 봉개동', type: '법정동', admin_parent: '봉개동' },
    '아라일동': { lat: 33.4650, lon: 126.5500, name: '제주특별자치시 제주시 아라일동', type: '법정동', admin_parent: '아라동' },
    '아라이동': { lat: 33.4650, lon: 126.5500, name: '제주특별자치시 제주시 아라이동', type: '법정동', admin_parent: '아라동' },
    '영평동': { lat: 33.4650, lon: 126.5500, name: '제주특별자치시 제주시 영평동', type: '법정동', admin_parent: '아라동' },
    '오등동': { lat: 33.4650, lon: 126.5500, name: '제주특별자치시 제주시 오등동', type: '법정동', admin_parent: '아라동' },
    '오라일동': { lat: 33.4700, lon: 126.5000, name: '제주특별자치시 제주시 오라일동', type: '법정동', admin_parent: '오라동' },
    '오라이동': { lat: 33.4700, lon: 126.5000, name: '제주특별자치시 제주시 오라이동', type: '법정동', admin_parent: '오라동' },
    '오라삼동': { lat: 33.4700, lon: 126.5000, name: '제주특별자치시 제주시 오라삼동', type: '법정동', admin_parent: '오라동' },
    '연동_법정': { lat: 33.4900, lon: 126.4900, name: '제주특별자치시 제주시 연동', type: '법정동', admin_parent: '연동' },
    '노형동_법정': { lat: 33.4850, lon: 126.4700, name: '제주특별자치시 제주시 노형동', type: '법정동', admin_parent: '노형동' },
    '외도일동': { lat: 33.5050, lon: 126.4500, name: '제주특별자치시 제주시 외도일동', type: '법정동', admin_parent: '외도동' },
    '외도이동': { lat: 33.5050, lon: 126.4500, name: '제주특별자치시 제주시 외도이동', type: '법정동', admin_parent: '외도동' },
    '외도삼동': { lat: 33.5050, lon: 126.4500, name: '제주특별자치시 제주시 외도삼동', type: '법정동', admin_parent: '외도동' },
    '이호일동': { lat: 33.5150, lon: 126.4700, name: '제주특별자치시 제주시 이호일동', type: '법정동', admin_parent: '이호동' },
    '이호이동': { lat: 33.5150, lon: 126.4700, name: '제주특별자치시 제주시 이호이동', type: '법정동', admin_parent: '이호동' },
    '도두일동': { lat: 33.5200, lon: 126.4300, name: '제주특별자치시 제주시 도두일동', type: '법정동', admin_parent: '도두동' },
    '도두이동': { lat: 33.5200, lon: 126.4300, name: '제주특별자치시 제주시 도두이동', type: '법정동', admin_parent: '도두동' },
    '대서리': { lat: 33.9500, lon: 126.3200, name: '제주특별자치시 제주시 추자면 대서리', type: '법정리', admin_parent: '추자면' },
    '묵리': { lat: 33.9500, lon: 126.3200, name: '제주특별자치시 제주시 추자면 묵리', type: '법정리', admin_parent: '추자면' },
    '신양리': { lat: 33.9500, lon: 126.3200, name: '제주특별자치시 제주시 추자면 신양리', type: '법정리', admin_parent: '추자면' },
    '영흥리': { lat: 33.9500, lon: 126.3200, name: '제주특별자치시 제주시 추자면 영흥리', type: '법정리', admin_parent: '추자면' },
    '예초리': { lat: 33.9500, lon: 126.3200, name: '제주특별자치시 제주시 추자면 예초리', type: '법정리', admin_parent: '추자면' },
    '고산리': { lat: 33.3200, lon: 126.1700, name: '제주특별자치시 제주시 한경면 고산리', type: '법정리', admin_parent: '한경면' },
    '금등리': { lat: 33.3200, lon: 126.1700, name: '제주특별자치시 제주시 한경면 금등리', type: '법정리', admin_parent: '한경면' },
    '낙천리': { lat: 33.3200, lon: 126.1700, name: '제주특별자치시 제주시 한경면 낙천리', type: '법정리', admin_parent: '한경면' },
    '두모리': { lat: 33.3200, lon: 126.1700, name: '제주특별자치시 제주시 한경면 두모리', type: '법정리', admin_parent: '한경면' },
    '신창리': { lat: 33.3200, lon: 126.1700, name: '제주특별자치시 제주시 한경면 신창리', type: '법정리', admin_parent: '한경면' },
    '용수리': { lat: 33.3200, lon: 126.1700, name: '제주특별자치시 제주시 한경면 용수리', type: '법정리', admin_parent: '한경면' },
    '저지리': { lat: 33.3200, lon: 126.1700, name: '제주특별자치시 제주시 한경면 저지리', type: '법정리', admin_parent: '한경면' },
    '조수리': { lat: 33.3200, lon: 126.1700, name: '제주특별자치시 제주시 한경면 조수리', type: '법정리', admin_parent: '한경면' },
    '청수리': { lat: 33.3200, lon: 126.1700, name: '제주특별자치시 제주시 한경면 청수리', type: '법정리', admin_parent: '한경면' },
    '판포리': { lat: 33.3200, lon: 126.1700, name: '제주특별자치시 제주시 한경면 판포리', type: '법정리', admin_parent: '한경면' },
    '귀덕리': { lat: 33.4100, lon: 126.2600, name: '제주특별자치시 제주시 한림읍 귀덕리', type: '법정리', admin_parent: '한림읍' },
    '금능리': { lat: 33.4100, lon: 126.2600, name: '제주특별자치시 제주시 한림읍 금능리', type: '법정리', admin_parent: '한림읍' },
    '금악리': { lat: 33.4100, lon: 126.2600, name: '제주특별자치시 제주시 한림읍 금악리', type: '법정리', admin_parent: '한림읍' },
    '대림리': { lat: 33.4100, lon: 126.2600, name: '제주특별자치시 제주시 한림읍 대림리', type: '법정리', admin_parent: '한림읍' },
    '동명리': { lat: 33.4100, lon: 126.2600, name: '제주특별자치시 제주시 한림읍 동명리', type: '법정리', admin_parent: '한림읍' },
    '명월리': { lat: 33.4100, lon: 126.2600, name: '제주특별자치시 제주시 한림읍 명월리', type: '법정리', admin_parent: '한림읍' },
    '상대리': { lat: 33.4100, lon: 126.2600, name: '제주특별자치시 제주시 한림읍 상대리', type: '법정리', admin_parent: '한림읍' },
    '상명리': { lat: 33.4100, lon: 126.2600, name: '제주특별자치시 제주시 한림읍 상명리', type: '법정리', admin_parent: '한림읍' },
    '수원리': { lat: 33.4100, lon: 126.2600, name: '제주특별자치시 제주시 한림읍 수원리', type: '법정리', admin_parent: '한림읍' },
    '옹포리': { lat: 33.4100, lon: 126.2600, name: '제주특별자치시 제주시 한림읍 옹포리', type: '법정리', admin_parent: '한림읍' },
    '월령리': { lat: 33.4100, lon: 126.2600, name: '제주특별자치시 제주시 한림읍 월령리', type: '법정리', admin_parent: '한림읍' },
    '월림리': { lat: 33.4100, lon: 126.2600, name: '제주특별자치시 제주시 한림읍 월림리', type: '법정리', admin_parent: '한림읍' },
    '한림리': { lat: 33.4100, lon: 126.2600, name: '제주특별자치시 제주시 한림읍 한림리', type: '법정리', admin_parent: '한림읍' },
    '한수리': { lat: 33.4100, lon: 126.2600, name: '제주특별자치시 제주시 한림읍 한수리', type: '법정리', admin_parent: '한림읍' },
    '협재리': { lat: 33.4100, lon: 126.2600, name: '제주특별자치시 제주시 한림읍 협재리', type: '법정리', admin_parent: '한림읍' },
    '고내리': { lat: 33.4600, lon: 126.3300, name: '제주특별자치시 제주시 애월읍 고내리', type: '법정리', admin_parent: '애월읍' },
    '고성리': { lat: 33.4600, lon: 126.3300, name: '제주특별자치시 제주시 애월읍 고성리', type: '법정리', admin_parent: '애월읍' },
    '곽지리': { lat: 33.4600, lon: 126.3300, name: '제주특별자치시 제주시 애월읍 곽지리', type: '법정리', admin_parent: '애월읍' },
    '광령리': { lat: 33.4600, lon: 126.3300, name: '제주특별자치시 제주시 애월읍 광령리', type: '법정리', admin_parent: '애월읍' },
    '구엄리': { lat: 33.4600, lon: 126.3300, name: '제주특별자치시 제주시 애월읍 구엄리', type: '법정리', admin_parent: '애월읍' },
    '금성리': { lat: 33.4600, lon: 126.3300, name: '제주특별자치시 제주시 애월읍 금성리', type: '법정리', admin_parent: '애월읍' },
    '납읍리': { lat: 33.4600, lon: 126.3300, name: '제주특별자치시 제주시 애월읍 납읍리', type: '법정리', admin_parent: '애월읍' },
    '봉성리': { lat: 33.4600, lon: 126.3300, name: '제주특별자치시 제주시 애월읍 봉성리', type: '법정리', admin_parent: '애월읍' },
    '상가리': { lat: 33.4600, lon: 126.3300, name: '제주특별자치시 제주시 애월읍 상가리', type: '법정리', admin_parent: '애월읍' },
    '상귀리': { lat: 33.4600, lon: 126.3300, name: '제주특별자치시 제주시 애월읍 상귀리', type: '법정리', admin_parent: '애월읍' },
    '소길리': { lat: 33.4600, lon: 126.3300, name: '제주특별자치시 제주시 애월읍 소길리', type: '법정리', admin_parent: '애월읍' },
    '수산리': { lat: 33.4600, lon: 126.3300, name: '제주특별자치시 제주시 애월읍 수산리', type: '법정리', admin_parent: '애월읍' },
    '애월리': { lat: 33.4600, lon: 126.3300, name: '제주특별자치시 제주시 애월읍 애월리', type: '법정리', admin_parent: '애월읍' },
    '어음리': { lat: 33.4600, lon: 126.3300, name: '제주특별자치시 제주시 애월읍 어음리', type: '법정리', admin_parent: '애월읍' },
    '신엄리': { lat: 33.4600, lon: 126.3300, name: '제주특별자치시 제주시 애월읍 신엄리', type: '법정리', admin_parent: '애월읍' },
    '유수암리': { lat: 33.4600, lon: 126.3300, name: '제주특별자치시 제주시 애월읍 유수암리', type: '법정리', admin_parent: '애월읍' },
    '김녕리': { lat: 33.5100, lon: 126.7500, name: '제주특별자치시 제주시 구좌읍 김녕리', type: '법정리', admin_parent: '구좌읍' },
    '덕천리': { lat: 33.5100, lon: 126.7500, name: '제주특별자치시 제주시 구좌읍 덕천리', type: '법정리', admin_parent: '구좌읍' },
    '동복리': { lat: 33.5100, lon: 126.7500, name: '제주특별자치시 제주시 구좌읍 동복리', type: '법정리', admin_parent: '구좌읍' },
    '상도리': { lat: 33.5100, lon: 126.7500, name: '제주특별자치시 제주시 구좌읍 상도리', type: '법정리', admin_parent: '구좌읍' },
    '세화리': { lat: 33.5100, lon: 126.7500, name: '제주특별자치시 제주시 구좌읍 세화리', type: '법정리', admin_parent: '구좌읍' },
    '송당리': { lat: 33.5100, lon: 126.7500, name: '제주특별자치시 제주시 구좌읍 송당리', type: '법정리', admin_parent: '구좌읍' },
    '월정리': { lat: 33.5100, lon: 126.7500, name: '제주특별자치시 제주시 구좌읍 월정리', type: '법정리', admin_parent: '구좌읍' },
    '종달리': { lat: 33.5100, lon: 126.7500, name: '제주특별자치시 제주시 구좌읍 종달리', type: '법정리', admin_parent: '구좌읍' },
    '평대리': { lat: 33.5100, lon: 126.7500, name: '제주특별자치시 제주시 구좌읍 평대리', type: '법정리', admin_parent: '구좌읍' },
    '하도리': { lat: 33.5100, lon: 126.7500, name: '제주특별자치시 제주시 구좌읍 하도리', type: '법정리', admin_parent: '구좌읍' },
    '한동리': { lat: 33.5100, lon: 126.7500, name: '제주특별자치시 제주시 구좌읍 한동리', type: '법정리', admin_parent: '구좌읍' },
    '행원리': { lat: 33.5100, lon: 126.7500, name: '제주특별자치시 제주시 구좌읍 행원리', type: '법정리', admin_parent: '구좌읍' },
    '교래리': { lat: 33.5300, lon: 126.6600, name: '제주특별자치시 제주시 조천읍 교래리', type: '법정리', admin_parent: '조천읍' },
    '대흘리': { lat: 33.5300, lon: 126.6600, name: '제주특별자치시 제주시 조천읍 대흘리', type: '법정리', admin_parent: '조천읍' },
    '북촌리': { lat: 33.5300, lon: 126.6600, name: '제주특별자치시 제주시 조천읍 북촌리', type: '법정리', admin_parent: '조천읍' },
    '선흘리': { lat: 33.5300, lon: 126.6600, name: '제주특별자치시 제주시 조천읍 선흘리', type: '법정리', admin_parent: '조천읍' },
    '신촌리': { lat: 33.5300, lon: 126.6600, name: '제주특별자치시 제주시 조천읍 신촌리', type: '법정리', admin_parent: '조천읍' },
    '신흥리': { lat: 33.5300, lon: 126.6600, name: '제주특별자치시 제주시 조천읍 신흥리', type: '법정리', admin_parent: '조천읍' },
    '와산리': { lat: 33.5300, lon: 126.6600, name: '제주특별자치시 제주시 조천읍 와산리', type: '법정리', admin_parent: '조천읍' },
    '와흘리': { lat: 33.5300, lon: 126.6600, name: '제주특별자치시 제주시 조천읍 와흘리', type: '법정리', admin_parent: '조천읍' },
    '조천리': { lat: 33.5300, lon: 126.6600, name: '제주특별자치시 제주시 조천읍 조천리', type: '법정리', admin_parent: '조천읍' },
    '함덕리': { lat: 33.5300, lon: 126.6600, name: '제주특별자치시 제주시 조천읍 함덕리', type: '법정리', admin_parent: '조천읍' },
    '연평리': { lat: 33.5130, lon: 126.9460, name: '제주특별자치시 제주시 우도면 연평리', type: '법정리', admin_parent: '우도면' },


    // ===== 서귀포시 (행정동 및 그에 속하는 법정동/리) =====
   '서귀포': { lat: 33.2500, lon: 126.5600, name: '제주특별자치시 서귀포시', type: '기초자치단체' },
    '서귀포시': { lat: 33.2500, lon: 126.5600, name: '제주특별자치시 서귀포시', type: '기초자치단체' },


    // 서귀포시 행정동
    '정방동': { lat: 33.2500, lon: 126.5650, name: '제주특별자치시 서귀포시 정방동', type: '행정동', contains_legal_divisions: ['서귀동_정방동_관할'] },
    '중앙동': { lat: 33.2450, lon: 126.5580, name: '제주특별자치시 서귀포시 중앙동', type: '행정동', contains_legal_divisions: ['서귀동_중앙동_관할'] },
    '천지동': { lat: 33.2530, lon: 126.5600, name: '제주특별자치시 서귀포시 천지동', type: '행정동', contains_legal_divisions: ['서귀동_천지동_관할', '서홍동_천지동_관할'] },
    '효돈동': { lat: 33.2800, lon: 126.6100, name: '제주특별자치시 서귀포시 효돈동', type: '행정동', contains_legal_divisions: ['하효동', '신효동'] },
    '영천동': { lat: 33.2850, lon: 126.5800, name: '제주특별자치시 서귀포시 영천동', type: '행정동', contains_legal_divisions: ['토평동', '서귀동_영천동_관할'] },
    '동홍동': { lat: 33.2700, lon: 126.5600, name: '제주특별자치시 서귀포시 동홍동', type: '행정동', contains_legal_divisions: ['동홍동'] },
    '서홍동': { lat: 33.2600, lon: 126.5400, name: '제주특별자치시 서귀포시 서홍동', type: '행정동', contains_legal_divisions: ['서홍동_서홍동_관할'] },
    '대륜동': { lat: 33.2400, lon: 126.5300, name: '제주특별자치시 서귀포시 대륜동', type: '행정동', contains_legal_divisions: ['법환동', '서호동', '호근동'] },
    '대천동': { lat: 33.2500, lon: 126.5100, name: '제주특별자치시 서귀포시 대천동', type: '행정동', contains_legal_divisions: ['강정동', '도순동', '영남동', '월평동'] },
    '중문동': { lat: 33.2500, lon: 126.4300, name: '제주특별자치시 서귀포시 중문동', type: '행정동', contains_legal_divisions: ['중문동', '대포동', '하원동', '회수동'] },
    '예래동': { lat: 33.2400, lon: 126.3700, name: '제주특별자치시 서귀포시 예래동', type: '행정동', contains_legal_divisions: ['예래동', '상예동', '하예동'] },
    '대정읍': { lat: 33.2100, lon: 126.2600, name: '제주특별자치시 서귀포시 대정읍', type: '읍', contains_legal_divisions: ['하모리', '상모리', '신평리', '영락리', '무릉리', '보성리', '안성리', '구억리', '인성리', '일과리', '동일1리', '동일2리', '가파리', '마라리'] },
    '남원읍': { lat: 33.2800, lon: 126.7300, name: '제주특별자치시 서귀포시 남원읍', type: '읍', contains_legal_divisions: ['남원리', '위미리', '태흥리', '한남리', '의귀리', '신례리', '하례리'] },
    '성산읍': { lat: 33.3800, lon: 126.8900, name: '제주특별자치시 서귀포시 성산읍', type: '읍', contains_legal_divisions: ['성산리', '고성리', '온평리', '신풍리', '수산리', '신천리', '삼달리', '오조리', '시흥리'] },
    '안덕면': { lat: 33.2500, lon: 126.3100, name: '제주특별자치시 서귀포시 안덕면', type: '면', contains_legal_divisions: ['화순리', '감산리', '서광리', '동광리', '사계리', '창천리', '상창리', '광평리', '덕수리'] },
    '표선면': { lat: 33.3000, lon: 126.8300, name: '제주특별자치시 서귀포시 표선면', type: '면', contains_legal_divisions: ['표선리', '세화리', '가시리', '성읍리', '하천리', '토산리'] },

    // 서귀포시 법정동/리 (해당 행정동의 좌표 재사용)
    '서귀동_정방동_관할': { lat: 33.2500, lon: 126.5650, name: '제주특별자치시 서귀포시 서귀동', type: '법정동', admin_parent: '정방동' },
    '서귀동_중앙동_관할': { lat: 33.2450, lon: 126.5580, name: '제주특별자치시 서귀포시 서귀동', type: '법정동', admin_parent: '중앙동' },
    '서귀동_천지동_관할': { lat: 33.2530, lon: 126.5600, name: '제주특별자치시 서귀포시 서귀동', type: '법정동', admin_parent: '천지동' },
    '서홍동_천지동_관할': { lat: 33.2530, lon: 126.5600, name: '제주특별자치시 서귀포시 서홍동', type: '법정동', admin_parent: '천지동' },
    '하효동': { lat: 33.2800, lon: 126.6100, name: '제주특별자치시 서귀포시 하효동', type: '법정동', admin_parent: '효돈동' },
    '신효동': { lat: 33.2800, lon: 126.6100, name: '제주특별자치시 서귀포시 신효동', type: '법정동', admin_parent: '효돈동' },
    '토평동': { lat: 33.2850, lon: 126.5800, name: '제주특별자치시 서귀포시 토평동', type: '법정동', admin_parent: '영천동' },
    '서귀동_영천동_관할': { lat: 33.2850, lon: 126.5800, name: '제주특별자치시 서귀포시 서귀동', type: '법정동', admin_parent: '영천동' },
    '동홍동_법정': { lat: 33.2700, lon: 126.5600, name: '제주특별자치시 서귀포시 동홍동', type: '법정동', admin_parent: '동홍동' },
    '서홍동_서홍동_관할': { lat: 33.2600, lon: 126.5400, name: '제주특별자치시 서귀포시 서홍동', type: '법정동', admin_parent: '서홍동' },
    '법환동': { lat: 33.2400, lon: 126.5300, name: '제주특별자치시 서귀포시 법환동', type: '법정동', admin_parent: '대륜동' },
    '서호동': { lat: 33.2400, lon: 126.5300, name: '제주특별자치시 서귀포시 서호동', type: '법정동', admin_parent: '대륜동' },
    '호근동': { lat: 33.2400, lon: 126.5300, name: '제주특별자치시 서귀포시 호근동', type: '법정동', admin_parent: '대륜동' },
    '강정동': { lat: 33.2500, lon: 126.5100, name: '제주특별자치시 서귀포시 강정동', type: '법정동', admin_parent: '대천동' },
    '도순동': { lat: 33.2500, lon: 126.5100, name: '제주특별자치시 서귀포시 도순동', type: '법정동', admin_parent: '대천동' },
    '영남동': { lat: 33.2500, lon: 126.5100, name: '제주특별자치시 서귀포시 영남동', type: '법정동', admin_parent: '대천동' },
    '월평동': { lat: 33.2500, lon: 126.5100, name: '제주특별자치시 서귀포시 월평동', type: '법정동', admin_parent: '대천동' },
    '중문동_법정': { lat: 33.2500, lon: 126.4300, name: '제주특별자치시 서귀포시 중문동', type: '법정동', admin_parent: '중문동' },
    '대포동': { lat: 33.2500, lon: 126.4300, name: '제주특별자치시 서귀포시 대포동', type: '법정동', admin_parent: '중문동' },
    '하원동': { lat: 33.2500, lon: 126.4300, name: '제주특별자치시 서귀포시 하원동', type: '법정동', admin_parent: '중문동' },
    '회수동': { lat: 33.2500, lon: 126.4300, name: '제주특별자치시 서귀포시 회수동', type: '법정동', admin_parent: '중문동' },
    '예래동_법정': { lat: 33.2400, lon: 126.3700, name: '제주특별자치시 서귀포시 예래동', type: '법정동', admin_parent: '예래동' },
    '상예동': { lat: 33.2400, lon: 126.3700, name: '제주특별자치시 서귀포시 상예동', type: '법정동', admin_parent: '예래동' },
    '하예동': { lat: 33.2400, lon: 126.3700, name: '제주특별자치시 서귀포시 하예동', type: '법정동', admin_parent: '예래동' },
    '하모리': { lat: 33.2100, lon: 126.2600, name: '제주특별자치시 서귀포시 대정읍 하모리', type: '법정리', admin_parent: '대정읍' },
    '상모리': { lat: 33.2100, lon: 126.2600, name: '제주특별자치시 서귀포시 대정읍 상모리', type: '법정리', admin_parent: '대정읍' },
    '신평리': { lat: 33.2100, lon: 126.2600, name: '제주특별자치시 서귀포시 대정읍 신평리', type: '법정리', admin_parent: '대정읍' },
    '영락리': { lat: 33.2100, lon: 126.2600, name: '제주특별자치시 서귀포시 대정읍 영락리', type: '법정리', admin_parent: '대정읍' },
    '무릉리': { lat: 33.2100, lon: 126.2600, name: '제주특별자치시 서귀포시 대정읍 무릉리', type: '법정리', admin_parent: '대정읍' },
    '보성리': { lat: 33.2100, lon: 126.2600, name: '제주특별자치시 서귀포시 대정읍 보성리', type: '법정리', admin_parent: '대정읍' },
    '안성리': { lat: 33.2100, lon: 126.2600, name: '제주특별자치시 서귀포시 대정읍 안성리', type: '법정리', admin_parent: '대정읍' },
    '구억리': { lat: 33.2100, lon: 126.2600, name: '제주특별자치시 서귀포시 대정읍 구억리', type: '법정리', admin_parent: '대정읍' },
    '인성리': { lat: 33.2100, lon: 126.2600, name: '제주특별자치시 서귀포시 대정읍 인성리', type: '법정리', admin_parent: '대정읍' },
    '일과리': { lat: 33.2100, lon: 126.2600, name: '제주특별자치시 서귀포시 대정읍 일과리', type: '법정리', admin_parent: '대정읍' },
    '동일1리': { lat: 33.2100, lon: 126.2600, name: '제주특별자치시 서귀포시 대정읍 동일1리', type: '법정리', admin_parent: '대정읍' },
    '동일2리': { lat: 33.2100, lon: 126.2600, name: '제주특별자치시 서귀포시 대정읍 동일2리', type: '법정리', admin_parent: '대정읍' },
    '가파리': { lat: 33.2100, lon: 126.2600, name: '제주특별자치시 서귀포시 대정읍 가파리', type: '법정리', admin_parent: '대정읍' },
    '마라리': { lat: 33.2100, lon: 126.2600, name: '제주특별자치시 서귀포시 대정읍 마라리', type: '법정리', admin_parent: '대정읍' },
    '남원리': { lat: 33.2800, lon: 126.7300, name: '제주특별자치시 서귀포시 남원읍 남원리', type: '법정리', admin_parent: '남원읍' },
    '위미리': { lat: 33.2800, lon: 126.7300, name: '제주특별자치시 서귀포시 남원읍 위미리', type: '법정리', admin_parent: '남원읍' },
    '태흥리': { lat: 33.2800, lon: 126.7300, name: '제주특별자치시 서귀포시 남원읍 태흥리', type: '법정리', admin_parent: '남원읍' },
    '한남리': { lat: 33.2800, lon: 126.7300, name: '제주특별자치시 서귀포시 남원읍 한남리', type: '법정리', admin_parent: '남원읍' },
    '의귀리': { lat: 33.2800, lon: 126.7300, name: '제주특별자치시 서귀포시 남원읍 의귀리', type: '법정리', admin_parent: '남원읍' },
    '신례리': { lat: 33.2800, lon: 126.7300, name: '제주특별자치시 서귀포시 남원읍 신례리', type: '법정리', admin_parent: '남원읍' },
    '하례리': { lat: 33.2800, lon: 126.7300, name: '제주특별자치시 서귀포시 남원읍 하례리', type: '법정리', admin_parent: '남원읍' },
    '성산리': { lat: 33.3800, lon: 126.8900, name: '제주특별자치시 서귀포시 성산읍 성산리', type: '법정리', admin_parent: '성산읍' },
    '고성리': { lat: 33.3800, lon: 126.8900, name: '제주특별자치시 서귀포시 성산읍 고성리', type: '법정리', admin_parent: '성산읍' },
    '온평리': { lat: 33.3800, lon: 126.8900, name: '제주특별자치시 서귀포시 성산읍 온평리', type: '법정리', admin_parent: '성산읍' },
    '신풍리': { lat: 33.3800, lon: 126.8900, name: '제주특별자치시 서귀포시 성산읍 신풍리', type: '법정리', admin_parent: '성산읍' },
    '수산리_성산읍': { lat: 33.3800, lon: 126.8900, name: '제주특별자치시 서귀포시 성산읍 수산리', type: '법정리', admin_parent: '성산읍' },
    '신천리': { lat: 33.3800, lon: 126.8900, name: '제주특별자치시 서귀포시 성산읍 신천리', type: '법정리', admin_parent: '성산읍' },
    '삼달리': { lat: 33.3800, lon: 126.8900, name: '제주특별자치시 서귀포시 성산읍 삼달리', type: '법정리', admin_parent: '성산읍' },
    '오조리': { lat: 33.3800, lon: 126.8900, name: '제주특별자치시 서귀포시 성산읍 오조리', type: '법정리', admin_parent: '성산읍' },
    '시흥리': { lat: 33.3800, lon: 126.8900, name: '제주특별자치시 서귀포시 성산읍 시흥리', type: '법정리', admin_parent: '성산읍' },
    '화순리': { lat: 33.2500, lon: 126.3100, name: '제주특별자치시 서귀포시 안덕면 화순리', type: '법정리', admin_parent: '안덕면' },
    '감산리': { lat: 33.2500, lon: 126.3100, name: '제주특별자치시 서귀포시 안덕면 감산리', type: '법정리', admin_parent: '안덕면' },
    '서광리': { lat: 33.2500, lon: 126.3100, name: '제주특별자치시 서귀포시 안덕면 서광리', type: '법정리', admin_parent: '안덕면' },
    '동광리': { lat: 33.2500, lon: 126.3100, name: '제주특별자치시 서귀포시 안덕면 동광리', type: '법정리', admin_parent: '안덕면' },
    '사계리': { lat: 33.2500, lon: 126.3100, name: '제주특별자치시 서귀포시 안덕면 사계리', type: '법정리', admin_parent: '안덕면' },
    '창천리': { lat: 33.2500, lon: 126.3100, name: '제주특별자치시 서귀포시 안덕면 창천리', type: '법정리', admin_parent: '안덕면' },
    '상창리': { lat: 33.2500, lon: 126.3100, name: '제주특별자치시 서귀포시 안덕면 상창리', type: '법정리', admin_parent: '안덕면' },
    '광평리': { lat: 33.2500, lon: 126.3100, name: '제주특별자치시 서귀포시 안덕면 광평리', type: '법정리', admin_parent: '안덕면' },
    '덕수리': { lat: 33.2500, lon: 126.3100, name: '제주특별자치시 서귀포시 안덕면 덕수리', type: '법정리', admin_parent: '안덕면' },
    '표선리': { lat: 33.3000, lon: 126.8300, name: '제주특별자치시 서귀포시 표선면 표선리', type: '법정리', admin_parent: '표선면' },
    '세화리_표선면': { lat: 33.3000, lon: 126.8300, name: '제주특별자치시 서귀포시 표선면 세화리', type: '법정리', admin_parent: '표선면' },
    '가시리': { lat: 33.3000, lon: 126.8300, name: '제주특별자치시 서귀포시 표선면 가시리', type: '법정리', admin_parent: '표선면' },
    '성읍리': { lat: 33.3000, lon: 126.8300, name: '제주특별자치시 서귀포시 표선면 성읍리', type: '법정리', admin_parent: '표선면' },
    '하천리': { lat: 33.3000, lon: 126.8300, name: '제주특별자치시 서귀포시 표선면 하천리', type: '법정리', admin_parent: '표선면' },
    '토산리': { lat: 33.3000, lon: 126.8300, name: '제주특별자치시 서귀포시 표선면 토산리', type: '법정리', admin_parent: '표선면' },





  


 // 서울특별시 (Seoul Metropolitan City)
  '종로구': { lat: 37.5735, lon: 126.9788, name: '서울특별시 종로구' },
  '중구': { lat: 37.5601, lon: 126.9940, name: '서울특별시 중구' },
  '용산구': { lat: 37.5284, lon: 126.9740, name: '서울특별시 용산구' },
  '성동구': { lat: 37.5457, lon: 127.0360, name: '서울특별시 성동구' },
  '광진구': { lat: 37.5428, lon: 127.0838, name: '서울특별시 광진구' },
  '동대문구': { lat: 37.5620, lon: 127.0549, name: '서울특별시 동대문구' },
  '중랑구': { lat: 37.6063, lon: 127.0934, name: '서울특별시 중랑구' },
  '성북구': { lat: 37.5894, lon: 127.0167, name: '서울특별시 성북구' },
  '강북구': { lat: 37.6433, lon: 127.0132, name: '서울특별시 강북구' },
  '도봉구': { lat: 37.6690, lon: 127.0305, name: '서울특별시 도봉구' },
  '노원구': { lat: 37.6534, lon: 127.0760, name: '서울특별시 노원구' },
  '은평구': { lat: 37.6176, lon: 126.9242, name: '서울특별시 은평구' },
  '서대문구': { lat: 37.5647, lon: 126.9468, name: '서울특별시 서대문구' },
  '마포구': { lat: 37.5434, lon: 126.9080, name: '서울특별시 마포구' },
  '양천구': { lat: 37.5100, lon: 126.8660, name: '서울특별시 양천구' },
  '강서구': { lat: 37.5458, lon: 126.7914, name: '서울특별시 강서구' },
  '구로구': { lat: 37.4789, lon: 126.8817, name: '서울특별시 구로구' },
  '금천구': { lat: 37.4326, lon: 126.9157, name: '서울특별시 금천구' },
  '영등포구': { lat: 37.4950, lon: 126.9360, name: '서울특별시 영등포구' },
  '동작구': { lat: 37.4769, lon: 126.9608, name: '서울특별시 동작구' },
  '관악구': { lat: 37.4380, lon: 126.9680, name: '서울특별시 관악구' },
  '서초구': { lat: 37.4927, lon: 127.0142, name: '서울특별시 서초구' },
  '강남구': { lat: 37.5126, lon: 127.0583, name: '서울특별시 강남구' },
  '송파구': { lat: 37.5392, lon: 127.1170, name: '서울특별시 송파구' },
  '강동구': { lat: 37.5550, lon: 127.1517, name: '서울특별시 강동구' },

  // 부산광역시 (Busan Metropolitan City)
  '중구': { lat: 35.1051, lon: 129.0305, name: '부산광역시 중구' },
  '서구': { lat: 35.0838, lon: 129.0142, name: '부산광역시 서구' },
  '동구': { lat: 35.1017, lon: 129.0494, name: '부산광역시 동구' },
  '영도구': { lat: 35.0976, lon: 129.0469, name: '부산광역시 영도구' },
  '부산진구': { lat: 35.1437, lon: 129.0397, name: '부산광역시 부산진구' },
  '동래구': { lat: 35.1818, lon: 129.0792, name: '부산광역시 동래구' },
  '남구': { lat: 35.0991, lon: 129.0910, name: '부산광역시 남구' },
  '북구': { lat: 35.1950, lon: 129.0135, name: '부산광역시 북구' },
  '해운대구': { lat: 35.1469, lon: 129.1557, name: '부산광역시 해운대구' },
  '사하구': { lat: 35.0743, lon: 128.9808, name: '부산광역시 사하구' },
  '금정구': { lat: 35.2155, lon: 129.0837, name: '부산광역시 금정구' },
  '강서구': { lat: 35.0847, lon: 128.9328, name: '부산광역시 강서구' },
  '연제구': { lat: 35.1663, lon: 129.0560, name: '부산광역시 연제구' },
  '수영구': { lat: 35.1118, lon: 129.1231, name: '부산광역시 수영구' },
  '사상구': { lat: 35.1009, lon: 129.0028, name: '부산광역시 사상구' },
  '기장군': { lat: 35.1764, lon: 129.1957, name: '부산광역시 기장군' },

  // 대구광역시 (Daegu Metropolitan City)
  '중구': { lat: 35.8653, lon: 128.5910, name: '대구광역시 중구' },
  '동구': { lat: 35.8770, lon: 128.6534, name: '대구광역시 동구' },
  '서구': { lat: 35.8349, lon: 128.5602, name: '대구광역시 서구' },
  '남구': { lat: 35.8299, lon: 128.5966, name: '대구광역시 남구' },
  '북구': { lat: 35.9011, lon: 128.6010, name: '대구광역시 북구' },
  '수성구': { lat: 35.8378, lon: 128.6420, name: '대구광역시 수성구' },
  '달서구': { lat: 35.8166, lon: 128.5529, name: '대구광역시 달서구' },
  '달성군': { lat: 35.7335, lon: 128.5029, name: '대구광역시 달성군' },
  '군위군': { lat: 36.0094, lon: 128.5779, name: '대구광역시 군위군' },

  // 인천광역시 (Incheon Metropolitan City)
  '중구': { lat: 37.4736, lon: 126.6213, name: '인천광역시 중구' },
  '동구': { lat: 37.4746, lon: 126.6578, name: '인천광역시 동구' },
  '미추홀구': { lat: 37.4628, lon: 126.6568, name: '인천광역시 미추홀구' },
  '연수구': { lat: 37.3995, lon: 126.6713, name: '인천광역시 연수구' },
  '남동구': { lat: 37.4480, lon: 126.7366, name: '인천광역시 남동구' },
  '부평구': { lat: 37.5083, lon: 126.7178, name: '인천광역시 부평구' },
  '계양구': { lat: 37.5256, lon: 126.7397, name: '인천광역시 계양구' },
  '서구': { lat: 37.5451, lon: 126.6738, name: '인천광역시 서구' },
  '강화군': { lat: 37.7490, lon: 126.4173, name: '인천광역시 강화군' },
  '옹진군': { lat: 37.4646, lon: 126.6346, name: '인천광역시 옹진군' },

  // 광주광역시 (Gwangju Metropolitan City)
  '동구': { lat: 35.1438, lon: 126.9209, name: '광주광역시 동구' },
  '서구': { lat: 35.1119, lon: 126.8667, name: '광주광역시 서구' },
  '남구': { lat: 35.0667, lon: 126.8778, name: '광주광역시 남구' },
  '북구': { lat: 35.1636, lon: 126.9067, name: '광주광역시 북구' },
  '광산구': { lat: 35.1158, lon: 126.8140, name: '광주광역시 광산구' },

  // 대전광역시 (Daejeon Metropolitan City)
  '동구': { lat: 36.3353, lon: 127.4665, name: '대전광역시 동구' },
  '중구': { lat: 36.2941, lon: 127.4332, name: '대전광역시 중구' },
  '서구': { lat: 36.2486, lon: 127.3986, name: '대전광역시 서구' },
  '유성구': { lat: 36.3243, lon: 127.3411, name: '대전광역시 유성구' },
  '대덕구': { lat: 36.3989, lon: 127.4697, name: '대전광역시 대덕구' },

  // 울산광역시 (Ulsan Metropolitan City)
  '중구': { lat: 35.5502, lon: 129.3175, name: '울산광역시 중구' },
  '남구': { lat: 35.5183, lon: 129.3499, name: '울산광역시 남구' },
  '동구': { lat: 35.5670, lon: 129.4001, name: '울산광역시 동구' },
  '북구': { lat: 35.6322, lon: 129.3197, name: '울산광역시 북구' },
  '울주군': { lat: 35.4326, lon: 129.3628, name: '울산광역시 울주군' },

  // 세종특별자치시 (Sejong Special Self-Governing City)
  '세종특별자치시': { lat: 36.4947, lon: 127.2917, name: '세종특별자치시' },

  // 경기도 (Gyeonggi-do)
  '수원시': { lat: 37.2831, lon: 127.0100, name: '경기도 수원시' },
  '고양시': { lat: 37.6534, lon: 126.7760, name: '경기도 고양시' },
  '용인시': { lat: 37.2185, lon: 127.2001, name: '경기도 용인시' },
  '성남시': { lat: 37.4326, lon: 127.1357, name: '경기도 성남시' },
  '부천시': { lat: 37.5033, lon: 126.7640, name: '경기도 부천시' },
  '안산시': { lat: 37.2985, lon: 126.8468, name: '경기도 안산시' },
  '화성시': { lat: 37.2091, lon: 126.8378, name: '경기도 화성시' },
  '남양주시': { lat: 37.6331, lon: 127.2186, name: '경기도 남양주시' },
  '안양시': { lat: 37.3897, lon: 126.9533, name: '경기도 안양시' },
  '평택시': { lat: 36.9904, lon: 127.0505, name: '경기도 평택시' },
  '의정부시': { lat: 37.7397, lon: 127.0494, name: '경기도 의정부시' },
  '파주시': { lat: 37.7590, lon: 126.7865, name: '경기도 파주시' },
  '시흥시': { lat: 37.3773, lon: 126.8050, name: '경기도 시흥시' },
  '김포시': { lat: 37.6124, lon: 126.7177, name: '경기도 김포시' },
  '광주시': { lat: 37.4145, lon: 127.2577, name: '경기도 광주시' },
  '광명시': { lat: 37.4757, lon: 126.8667, name: '경기도 광명시' },
  '군포시': { lat: 37.3586, lon: 126.9375, name: '경기도 군포시' },
  '하남시': { lat: 37.5647, lon: 127.2183, name: '경기도 하남시' },
  '오산시': { lat: 37.1472, lon: 127.0754, name: '경기도 오산시' },
  '이천시': { lat: 37.2838, lon: 127.4475, name: '경기도 이천시' },
  '구리시': { lat: 37.5916, lon: 127.1318, name: '경기도 구리시' },
  '안성시': { lat: 37.0051, lon: 127.2818, name: '경기도 안성시' },
  '포천시': { lat: 37.8927, lon: 127.2014, name: '경기도 포천시' },
  '양주시': { lat: 37.7824, lon: 127.0478, name: '경기도 양주시' },
  '동두천시': { lat: 37.9009, lon: 127.0626, name: '경기도 동두천시' },
  '과천시': { lat: 37.4263, lon: 126.9898, name: '경기도 과천시' },
  '가평군': { lat: 37.8288, lon: 127.5117, name: '경기도 가평군' },
  '양평군': { lat: 37.4889, lon: 127.4898, name: '경기도 양평군' },
  '여주시': { lat: 37.2985, lon: 127.6409, name: '경기도 여주시' },
  '연천군': { lat: 38.0833, lon: 127.0706, name: '경기도 연천군' },

  // 강원특별자치도 (Gangwon Special Self-Governing Province)
  '춘천시': { lat: 37.8785, lon: 127.7323, name: '강원특별자치도 춘천시' },
  '강릉시': { lat: 37.7491, lon: 128.8784, name: '강원특별자치도 강릉시' },
  '동해시': { lat: 37.5219, lon: 129.1166, name: '강원특별자치도 동해시' },
  '속초시': { lat: 38.2042, lon: 128.5941, name: '강원특별자치도 속초시' },
  '삼척시': { lat: 37.4470, lon: 129.1674, name: '강원특별자치도 삼척시' },
  '원주시': { lat: 37.3390, lon: 127.9220, name: '강원특별자치도 원주시' },
  '태백시': { lat: 37.1612, lon: 128.9879, name: '강원특별자치도 태백시' },
  '정선군': { lat: 37.3778, lon: 128.6630, name: '강원특별자치도 정선군' },
  '철원군': { lat: 38.1440, lon: 127.3157, name: '강원특별자치도 철원군' },
  '화천군': { lat: 38.1034, lon: 127.7103, name: '강원특별자치도 화천군' },
  '양구군': { lat: 38.1072, lon: 127.9922, name: '강원특별자치도 양구군' },
  '인제군': { lat: 38.0669, lon: 128.1726, name: '강원특별자치도 인제군' },
  '고성군': { lat: 38.3779, lon: 128.4701, name: '강원특별자치도 고성군' },
  '홍천군': { lat: 37.6944, lon: 127.8908, name: '강원특별자치도 홍천군' },
  '횡성군': { lat: 37.4889, lon: 127.9872, name: '강원특별자치도 횡성군' },
  '영월군': { lat: 37.1808, lon: 128.4640, name: '강원특별자치도 영월군' },
  '평창군': { lat: 37.3679, lon: 128.3923, name: '강원특별자치도 평창군' },
  '양양군': { lat: 38.0728, lon: 128.6213, name: '강원특별자치도 양양군' },

  // 충청북도 (Chungcheongbuk-do)
  '청주시': { lat: 36.6372, lon: 127.4896, name: '충청북도 청주시' },
  '충주시': { lat: 36.9850, lon: 127.9220, name: '충청북도 충주시' },
  '제천시': { lat: 37.1352, lon: 128.1923, name: '충청북도 제천시' },
  '보은군': { lat: 36.3197, lon: 127.7323, name: '충청북도 보은군' },
  '옥천군': { lat: 36.2941, lon: 127.5667, name: '충청북도 옥천군' },
  '영동군': { lat: 36.1738, lon: 127.7786, name: '충청북도 영동군' },
  '증평군': { lat: 36.7865, lon: 127.5750, name: '충청북도 증평군' },
  '진천군': { lat: 36.8530, lon: 127.4760, name: '충청북도 진천군' },
  '괴산군': { lat: 36.7865, lon: 127.7975, name: '충청북도 괴산군' },
  '음성군': { lat: 36.8778, lon: 127.6534, name: '충청북도 음성군' },
  '단양군': { lat: 36.9940, lon: 128.3628, name: '충청북도 단양군' },

  // 충청남도 (Chungcheongnam-do)
  '천안시': { lat: 36.8142, lon: 127.1150, name: '충청남도 천안시' },
  '공주시': { lat: 36.4528, lon: 127.1150, name: '충청남도 공주시' },
  '보령시': { lat: 36.3778, lon: 126.5941, name: '충청남도 보령시' },
  '아산시': { lat: 36.7865, lon: 127.0051, name: '충청남도 아산시' },
  '서산시': { lat: 36.7865, lon: 126.4701, name: '충청남도 서산시' },
  '논산시': { lat: 36.1950, lon: 127.1009, name: '충청남도 논산시' },
  '계룡시': { lat: 36.2185, lon: 127.2403, name: '충청남도 계룡시' },
  '당진시': { lat: 36.9191, lon: 126.6560, name: '충청남도 당진시' },
  '금산군': { lat: 36.0950, lon: 127.4896, name: '충청남도 금산군' },
  '부여군': { lat: 36.2754, lon: 126.9209, name: '충청남도 부여군' },
  '서천군': { lat: 36.1305, lon: 126.6560, name: '충청남도 서천군' },
  '청양군': { lat: 36.4380, lon: 126.9680, name: '충청남도 청양군' },
  '홍성군': { lat: 36.5947, lon: 126.6788, name: '충청남도 홍성군' },
  '예산군': { lat: 36.6636, lon: 126.8552, name: '충청남도 예산군' },
  '태안군': { lat: 36.7865, lon: 126.2941, name: '충청남도 태안군' },

  // 전라북도 (Jeollabuk-do)
  '전주시': { lat: 35.8202, lon: 127.1150, name: '전라북도 전주시' },
  '군산시': { lat: 35.9647, lon: 126.7052, name: '전라북도 군산시' },
  '익산시': { lat: 35.9189, lon: 126.9533, name: '전라북도 익산시' },
  '정읍시': { lat: 35.5847, lon: 126.8505, name: '전라북도 정읍시' },
  '남원시': { lat: 35.4045, lon: 127.3986, name: '전라북도 남원시' },
  '김제시': { lat: 35.8080, lon: 126.9468, name: '전라북도 김제시' },
  '완주군': { lat: 35.8491, lon: 127.2001, name: '전라북도 완주군' },
  '진안군': { lat: 35.7925, lon: 127.5667, name: '전라북도 진안군' },
  '무주군': { lat: 36.0094, lon: 127.7667, name: '전라북도 무주군' },
  '장수군': { lat: 35.6322, lon: 127.5602, name: '전라북도 장수군' },
  '임실군': { lat: 35.6022, lon: 127.2750, name: '전라북도 임실군' },
  '순창군': { lat: 35.3850, lon: 127.0706, name: '전라북도 순창군' },
  '고창군': { lat: 35.4590, lon: 126.6908, name: '전라북도 고창군' },
  '부안군': { lat: 35.7107, lon: 126.6960, name: '전라북도 부안군' },

  // 전라남도 (Jeollanam-do)
  '목포시': { lat: 34.8090, lon: 126.3888, name: '전라남도 목포시' },
  '여수시': { lat: 34.7679, lon: 127.7052, name: '전라남도 여수시' },
  '순천시': { lat: 34.9450, lon: 127.5305, name: '전라남도 순천시' },
  '나주시': { lat: 35.0163, lon: 126.7118, name: '전라남도 나주시' },
  '광양시': { lat: 34.9209, lon: 127.6788, name: '전라남도 광양시' },
  '담양군': { lat: 35.2941, lon: 126.9608, name: '전라남도 담양군' },
  '곡성군': { lat: 35.2091, lon: 127.2818, name: '전라남도 곡성군' },
  '구례군': { lat: 35.2091, lon: 127.4665, name: '전라남도 구례군' },
  '고흥군': { lat: 34.6247, lon: 127.3005, name: '전라남도 고흥군' },
  '보성군': { lat: 34.7679, lon: 127.2001, name: '전라남도 보성군' },
  '화순군': { lat: 35.0838, lon: 126.9533, name: '전라남도 화순군' },
  '장흥군': { lat: 34.6980, lon: 126.9533, name: '전라남도 장흥군' },
  '강진군': { lat: 34.5847, lon: 126.7590, name: '전라남도 강진군' },
  '해남군': { lat: 34.5847, lon: 126.6028, name: '전라남도 해남군' },
  '영암군': { lat: 34.8090, lon: 126.6800, name: '전라남도 영암군' },
  '무안군': { lat: 34.8090, lon: 126.4640, name: '전라남도 무안군' },
  '함평군': { lat: 35.0838, lon: 126.5602, name: '전라남도 함평군' },
  '영광군': { lat: 35.2091, lon: 126.5602, name: '전라남도 영광군' },
  '장성군': { lat: 35.3197, lon: 126.7865, name: '전라남도 장성군' },
  '완도군': { lat: 34.3197, lon: 126.7590, name: '전라남도 완도군' },
  '진도군': { lat: 34.4045, lon: 126.3533, name: '전라남도 진도군' },
  '신안군': { lat: 34.8090, lon: 126.0626, name: '전라남도 신안군' },

  // 경상북도 (Gyeongsangbuk-do)
  '포항시': { lat: 36.0315, lon: 129.3628, name: '경상북도 포항시' },
  '경주시': { lat: 35.8580, lon: 129.2157, name: '경상북도 경주시' },
  '김천시': { lat: 36.1040, lon: 128.1150, name: '경상북도 김천시' },
  '안동시': { lat: 36.5647, lon: 128.7299, name: '경상북도 안동시' },
  '구미시': { lat: 36.1264, lon: 128.3897, name: '경상북도 구미시' },
  '영주시': { lat: 36.8142, lon: 128.6908, name: '경상북도 영주시' },
  '영천시': { lat: 35.9899, lon: 128.9328, name: '경상북도 영천시' },
  '상주시': { lat: 36.4168, lon: 128.1610, name: '경상북도 상주시' },
  '문경시': { lat: 36.5750, lon: 128.2185, name: '경상북도 문경시' },
  '경산시': { lat: 35.8349, lon: 128.7477, name: '경상북도 경산시' },
  '의성군': { lat: 36.3686, lon: 128.6908, name: '경상북도 의성군' },
  '청송군': { lat: 36.4889, lon: 129.0792, name: '경상북도 청송군' },
  '영양군': { lat: 36.6636, lon: 129.1738, name: '경상북도 영양군' },
  '영덕군': { lat: 36.4168, lon: 129.3628, name: '경상북도 영덕군' },
  '봉화군': { lat: 37.0315, lon: 128.9879, name: '경상북도 봉화군' },
  '울진군': { lat: 36.9191, lon: 129.4168, name: '경상북도 울진군' },
  '울릉군': { lat: 37.5284, lon: 130.8660, name: '경상북도 울릉군' },
  '성주군': { lat: 35.9400, lon: 128.2403, name: '경상북도 성주군' },
  '고령군': { lat: 35.7335, lon: 128.2185, name: '경상북도 고령군' },
  '칠곡군': { lat: 35.9533, lon: 128.4045, name: '경상북도 칠곡군' },
  '예천군': { lat: 36.5847, lon: 128.4701, name: '경상북도 예천군' },
  '영덕군': { lat: 36.1738, lon: 129.3628, name: '경상북도 영덕군' },
  '청도군': { lat: 35.6980, lon: 128.7865, name: '경상북도 청도군' },

  // 경상남도 (Gyeongsangnam-do)
  '창원시': { lat: 35.2307, lon: 128.6817, name: '경상남도 창원시' },
  '진주시': { lat: 35.1848, lon: 128.0950, name: '경상남도 진주시' },
  '통영시': { lat: 34.8420, lon: 128.4208, name: '경상남도 통영시' },
  '사천시': { lat: 35.0950, lon: 128.0494, name: '경상남도 사천시' },
  '김해시': { lat: 35.2307, lon: 128.8784, name: '경상남도 김해시' },
  '밀양시': { lat: 35.4889, lon: 128.7590, name: '경상남도 밀양시' },
  '거제시': { lat: 34.8879, lon: 128.6028, name: '경상남도 거제시' },
  '양산시': { lat: 35.3400, lon: 129.0203, name: '경상남도 양산시' },
  '의령군': { lat: 35.3353, lon: 128.2577, name: '경상남도 의령군' },
  '함안군': { lat: 35.2536, lon: 128.4168, name: '경상남도 함안군' },
  '창녕군': { lat: 35.5392, lon: 128.4900, name: '경상남도 창녕군' },
  '고성군': { lat: 34.9899, lon: 128.2577, name: '경상남도 고성군' },
  '남해군': { lat: 34.7865, lon: 127.9009, name: '경상남도 남해군' },
  '하동군': { lat: 35.0838, lon: 127.8080, name: '경상남도 하동군' },
  '산청군': { lat: 35.4045, lon: 127.7667, name: '경상남도 산청군' },
  '함양군': { lat: 35.5284, lon: 127.7270, name: '경상남도 함양군' },
  '거창군': { lat: 35.6818, lon: 127.9191, name: '경상남도 거창군' },
  '합천군': { lat: 35.5894, lon: 128.1610, name: '경상남도 합천군' },

  // 제주특별자치도 (Jeju Special Self-Governing Province)
  '제주시': { lat: 33.4996, lon: 126.5311, name: '제주특별자치도 제주시' },
  '서귀포시': { lat: 33.2536, lon: 126.5602, name: '제주특별자치도 서귀포시' },
};



















/**
 * 위치 데이터 반환 함수 (호환성 유지)
 * @returns {Object} 전체 위치 좌표 데이터
 */
export function getLocationCoordinates() {
  return locationCoordinates;
}

/**
 * 행정구역 레벨별 우선순위 가중치
 */
export const PRIORITY_WEIGHTS = {
  SPECIAL_CITY: 1000,      // 특별시 (서울)
  METROPOLITAN: 900,       // 광역시 (부산, 대구, 인천, 광주, 대전, 울산)
  SPECIAL_AUTONOMOUS: 850, // 특별자치시/도 (세종, 제주)
  PROVINCE_CAPITAL: 800,   // 도청소재지
  CITY: 700,              // 일반 시
  COUNTY: 600,            // 군
  DISTRICT: 500,          // 구
  TOWN: 400,              // 읍
  TOWNSHIP: 300,          // 면
  DONG: 200               // 동
};

/**
 * 주요 도시별 인구수/중요도 기반 우선순위
 */
export const POPULATION_PRIORITY = {
  // 특별시/광역시
  '서울특별시': 1000,
  '부산광역시': 900,
  '인천광역시': 850,
  '대구광역시': 800,
  '대전광역시': 750,
  '광주광역시': 700,
  '울산광역시': 680,
  '세종특별자치시': 620,

  // 경기도 주요 도시
  '수원시': 580,
  '고양시': 570,
  '용인시': 560,
  '성남시': 550,
  '부천시': 540,
  '화성시': 530,
  '안산시': 520,
  '남양주시': 510,
  '안양시': 500,
  '평택시': 490,
  '시흥시': 480,
  '파주시': 470,
  '의정부시': 460,
  '김포시': 450,
  '광명시': 440,
  '군포시': 430,
  '오산시': 420,
  '이천시': 410,
  '양주시': 400,
  '구리시': 390,
  '안성시': 380,
  '포천시': 370,
  '의왕시': 360,
  '하남시': 350,
  '여주시': 340,
  '동두천시': 330,
  '과천시': 320,

  // 강원도
  '춘천시': 280,
  '원주시': 270,
  '강릉시': 260,
  '동해시': 250,
  '태백시': 240,
  '속초시': 230,
  '삼척시': 220,

  // 충청북도
  '청주시': 290,
  '충주시': 260,
  '제천시': 240,

  // 충청남도
  '천안시': 300,
  '공주시': 250,
  '보령시': 240,
  '아산시': 280,
  '서산시': 260,
  '논산시': 240,
  '계룡시': 220,
  '당진시': 270,

  // 전라북도
  '전주시': 290,
  '군산시': 270,
  '익산시': 260,
  '정읍시': 240,
  '남원시': 230,
  '김제시': 220,

  // 전라남도
  '목포시': 250,
  '여수시': 280,
  '순천시': 270,
  '나주시': 240,
  '광양시': 260,

  // 경상북도
  '포항시': 300,
  '경주시': 270,
  '김천시': 250,
  '안동시': 260,
  '구미시': 290,
  '영주시': 240,
  '영천시': 230,
  '상주시': 220,
  '문경시': 210,
  '경산시': 250,

  // 경상남도
  '창원시': 320,
  '진주시': 270,
  '통영시': 240,
  '사천시': 230,
  '김해시': 280,
  '밀양시': 220,
  '거제시': 250,
  '양산시': 260,

  // 제주특별자치도
  '제주시': 280,
  '서귀포시': 240
};















/**
 * 우선순위 계산 함수 (내부 함수)
 */
function calculatePriority(key, location, searchTerm) {
  let priority = 0;
  
  // 행정구역 레벨별 가중치
  if (location.name.includes('특별시')) priority += PRIORITY_WEIGHTS.SPECIAL_CITY;
  else if (location.name.includes('광역시')) priority += PRIORITY_WEIGHTS.METROPOLITAN;
  else if (location.name.includes('특별자치')) priority += PRIORITY_WEIGHTS.SPECIAL_AUTONOMOUS;
  else if (location.name.includes('도')) priority += PRIORITY_WEIGHTS.PROVINCE;
  else if (location.name.includes('시')) priority += PRIORITY_WEIGHTS.CITY;
  else if (location.name.includes('군')) priority += PRIORITY_WEIGHTS.COUNTY;
  else if (location.name.includes('구')) priority += PRIORITY_WEIGHTS.DISTRICT;
  else if (location.name.includes('읍')) priority += PRIORITY_WEIGHTS.TOWN;
  else if (location.name.includes('면')) priority += PRIORITY_WEIGHTS.TOWNSHIP;
  else if (location.name.includes('동')) priority += PRIORITY_WEIGHTS.NEIGHBORHOOD;
  
  // 완전 일치 보너스
  if (key === searchTerm) priority += 500;
  
  // 시작 일치 보너스
  if (key.startsWith(searchTerm)) priority += 200;
  
  return priority;
}

/**
 * 모든 매칭 결과를 우선순위 순으로 반환
 */
export function findAllMatches(searchTerm) {
  const normalizedSearch = searchTerm.trim();
  const matches = [];
  
  for (const [key, location] of Object.entries(locationCoordinates)) {
    if (key.includes(normalizedSearch) || location.name.includes(normalizedSearch)) {
      const priority = calculatePriority(key, location, normalizedSearch);
      matches.push({
        ...location,
        key,
        priority,
        matchType: 'partial'
      });
    }
  }
  
  return matches.sort((a, b) => b.priority - a.priority);
}

/**
 * 두 지점 간의 거리 계산 (Haversine 공식)
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * 반경 내 위치 검색
 */
export function findLocationsInRadius(centerLat, centerLon, radiusKm) {
  const results = [];
  
  for (const [key, location] of Object.entries(locationCoordinates)) {
    const distance = calculateDistance(centerLat, centerLon, location.lat, location.lon);
    
    if (distance <= radiusKm) {
      results.push({
        ...location,
        key,
        distance: Math.round(distance * 100) / 100
      });
    }
  }
  
  return results.sort((a, b) => a.distance - b.distance);
}

/**
 * 행정구역별 그룹화
 */
export function groupByRegion() {
  const grouped = {};
  
  for (const [key, location] of Object.entries(locationCoordinates)) {
    const parts = location.name.split(' ');
    const province = parts[0];
    
    if (!grouped[province]) {
      grouped[province] = [];
    }
    
    grouped[province].push({
      key,
      ...location
    });
  }
  
  // 각 그룹 내에서 이름순 정렬
  for (const province in grouped) {
    grouped[province].sort((a, b) => a.name.localeCompare(b.name));
  }
  
  return grouped;
}

/**
 * 행정구역 레벨별 필터링
 */
export function filterByLevel(level) {
  const results = [];
  
  for (const [key, location] of Object.entries(locationCoordinates)) {
    if (location.name.includes(level)) {
      results.push({
        key,
        ...location
      });
    }
  }
  
  return results.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 데이터 통계 정보
 */
export function getStatistics() {
  const stats = {
    totalLocations: Object.keys(locationCoordinates).length,
    byLevel: {
      특별시: 0,
      광역시: 0,
      특별자치시: 0,
      특별자치도: 0,
      도: 0,
      시: 0,
      군: 0,
      구: 0,
      읍: 0,
      면: 0,
      동: 0
    },
    byProvince: {}
  };
  
  for (const [key, location] of Object.entries(locationCoordinates)) {
    const name = location.name;
    
    // 레벨별 카운트
    if (name.includes('특별시')) stats.byLevel.특별시++;
    else if (name.includes('광역시')) stats.byLevel.광역시++;
    else if (name.includes('특별자치시')) stats.byLevel.특별자치시++;
    else if (name.includes('특별자치도')) stats.byLevel.특별자치도++;
    else if (name.includes('도')) stats.byLevel.도++;
    else if (name.includes('시')) stats.byLevel.시++;
    else if (name.includes('군')) stats.byLevel.군++;
    else if (name.includes('구')) stats.byLevel.구++;
    else if (name.includes('읍')) stats.byLevel.읍++;
    else if (name.includes('면')) stats.byLevel.면++;
    else if (name.includes('동')) stats.byLevel.동++;
    
    // 시도별 카운트
    const province = name.split(' ')[0];
    if (!stats.byProvince[province]) {
      stats.byProvince[province] = 0;
    }
    stats.byProvince[province]++;
  }
  
  return stats;
}

/**
 * 데이터 검증
 */
export function validateData() {
  const issues = [];
  
  for (const [key, location] of Object.entries(locationCoordinates)) {
    // 좌표 범위 검증
    if (location.lat < 33 || location.lat > 39) {
      issues.push(`${key}: 위도 범위 오류 (${location.lat})`);
    }
    
    if (location.lon < 124 || location.lon > 132) {
      issues.push(`${key}: 경도 범위 오류 (${location.lon})`);
    }
    
    // 필수 필드 검증
    if (!location.name) {
      issues.push(`${key}: name 필드 누락`);
    }
    
    if (typeof location.lat !== 'number') {
      issues.push(`${key}: lat 필드 타입 오류`);
    }
    
    if (typeof location.lon !== 'number') {
      issues.push(`${key}: lon 필드 타입 오류`);
    }
    
    // 중복 검사
    const duplicates = Object.entries(locationCoordinates)
      .filter(([k, l]) => k !== key && l.lat === location.lat && l.lon === location.lon);
    
    if (duplicates.length > 0) {
      issues.push(`${key}: 중복 좌표 발견 - ${duplicates.map(([k]) => k).join(', ')}`);
    }
  }
  
  return issues;
}

/**
 * 가장 가까운 위치 찾기
 */
export function findNearestLocation(lat, lon, excludeKey = null) {
  let nearest = null;
  let minDistance = Infinity;
  
  for (const [key, location] of Object.entries(locationCoordinates)) {
    if (key === excludeKey) continue;
    
    const distance = calculateDistance(lat, lon, location.lat, location.lon);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = {
        ...location,
        key,
        distance: Math.round(distance * 100) / 100
      };
    }
  }
  
  return nearest;
}

/**
 * 경계 박스 내 위치 검색
 */
export function findLocationsInBounds(northLat, southLat, eastLon, westLon) {
  const results = [];
  
  for (const [key, location] of Object.entries(locationCoordinates)) {
    if (
      location.lat >= southLat &&
      location.lat <= northLat &&
      location.lon >= westLon &&
      location.lon <= eastLon
    ) {
      results.push({
        ...location,
        key
      });
    }
  }
  
  return results.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * 자동완성용 검색
 */
export function getAutocompleteSuggestions(searchTerm, limit = 10) {
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const suggestions = [];
  
  for (const [key, location] of Object.entries(locationCoordinates)) {
    const keyLower = key.toLowerCase();
    const nameLower = location.name.toLowerCase();
    
    if (keyLower.includes(normalizedSearch) || nameLower.includes(normalizedSearch)) {
      const priority = calculatePriority(key, location, searchTerm);
      suggestions.push({
        key,
        name: location.name,
        priority
      });
    }
  }
  
  return suggestions
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

/**
 * 메타데이터 업데이트
 */
export function updateMetadata() {
  const stats = getStatistics();
  
  METADATA.totalLocations = stats.totalLocations;
  METADATA.coverage.cities = stats.byLevel.시;
  METADATA.coverage.districts = stats.byLevel.구;
  METADATA.coverage.neighborhoods = stats.byLevel.동;
  METADATA.lastUpdated = new Date().toISOString().split('T')[0];
  
  return METADATA;
}
