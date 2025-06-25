/**
 * 한국 행정구역 좌표 데이터
 * 최종 업데이트: 2024-06-24
 * 데이터 기준: 행정안전부 공식 행정구역 정보
 */

export const locationCoordinates = {


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
