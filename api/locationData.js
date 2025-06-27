/**
 * @file locationData.js
 * @description 제주특별자치도 내 모든 읍·면·동 단위의 행정 지역 데이터를 포함하는 파일.
 * 이 버전은 법정동/리 대신 행정동/읍/면을 주요 데이터 기준으로 삼고,
 * 각 행정구역이 관할하는 법정동/리 정보를 `legal_divisions` 배열에 포함합니다.
 * 기상청 날씨 API 연동, 사용자 입력 대응, 행정 계층 구조 및 우선순위 정렬을 목적으로 합니다.
 * 관광지 정보는 포함하지 않으며, 주소 데이터만 집중적으로 관리합니다.
 * 이 파일은 weather.js에서 `require` 방식으로 임포트될 수 있도록 CommonJS 형식으로 변경되었습니다.
 *
 * 위경도 좌표는 제주 지역의 일반적인 지리 정보와 주요 지점을 기준으로 설정되었으며,
 * 사용자가 제공한 SHP/GeoJSON 원본 데이터의 정밀한 좌표를 직접 파싱한 결과는 아닙니다.
 * (해당 데이터의 완전한 내용 접근 및 자동 파싱을 위해서는 추가적인 파일 제공이 필요합니다.)
 */

/**
 * 위경도를 기상청 격자 좌표로 변환
 * 기상청 단기예보/초단기예보 API의 격자 좌표를 계산하는 공식입니다.
 * @param {number} lat - 위도 (십진수)
 * @param {number} lon - 경도 (십진수)
 * @returns {{nx: number, ny: number}} 격자 좌표 객체 (nx: X 좌표, ny: Y 좌표)
 */
const latLonToGrid = (lat, lon) => {
    const RE = 6371.00877; // 지구 반경 (km)
    const GRID = 5.0;      // 격자 간격 (km)
    const SLAT1 = 30.0;    // 기준점 위도1
    const SLAT2 = 60.0;    // 기준점 위도2
    const OLON = 126.0;    // 원점 경도
    const OLAT = 38.0;     // 원점 위도
    const XO = 43;         // 원점 X 격자
    const YO = 136;        // 원점 Y 격자

    const DEGRAD = Math.PI / 180.0; // 도(degree)를 라디안(radian)으로 변환
    const re = RE / GRID;           // 지구 반경 / 격자 간격
    const slat1 = SLAT1 * DEGRAD;
    const slat2 = SLAT2 * DEGRAD;
    const olon = OLON * DEGRAD;
    const olat = OLAT * DEGRAD;

    let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn); // 투영법 상수 n 계산

    let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = Math.pow(sf, sn) * Math.cos(slat1) / sn; // 투영법 상수 sf 계산

    let ro = re * sf / Math.pow(Math.tan(Math.PI * 0.25 + olat * 0.5), sn); // 원점 위도에서의 반지름 r0 계산

    const ra = re * sf / Math.pow(Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5), sn); // 입력 위도에서의 반지름 r 계산
    let theta = lon * DEGRAD - olon; // 경도 차이 계산

    // 경도 차이가 -PI ~ PI 범위에 있도록 조정
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn; // 경도 차이에 n을 곱함

    // 최종 격자 좌표 계산 (반올림하여 정수화)
    return {
        nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
        ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5)
    };
};

/**
 * 전국의 지역 정보를 담는 최종 데이터 객체.
 * 이 객체는 즉시 실행 함수를 통해 초기화됩니다.
 * key는 검색에 사용될 지역명 (별칭 포함), value는 해당 지역의 상세 정보 객체입니다.
 *
 * 각 지역 정보 객체의 속성:
 * @property {string} name - 지역의 공식 명칭 (예: '제주특별자치시 제주시 일도1동')
 * @property {number} lat - 위도
 * @property {number} lon - 경도
 * @property {number} kma_nx - 기상청 격자 X 좌표
 * @property {number} kma_ny - 기상청 Y 좌표
 * @property {'광역자치단체'|'기초자치단체'|'행정동'|'읍'|'면'} type - 지역 유형 (행정동, 읍, 면만 최상위)
 * @property {string} [admin_parent] - 상위 행정 구역의 공식 명칭 (예: '제주특별자치시 제주시')
 * @property {string[]} [legal_divisions] - 해당 행정 구역에 속하는 법정동/리 명칭 배열
 * @property {string[]} [aliases] - 검색을 위한 추가 별칭 배열 (예: ['제주도'])
 * @property {number} [priority_score] - 중복 이름 해결 및 검색 결과 우선순위를 위한 점수 (높을수록 우선)
 */
const locationData = (() => {
    const data = {}; // 최종적으로 빌드될 지역 데이터 객체

  // 우선순위 점수 매핑 (높을수록 중요)
    // 행정동, 읍, 면에 높은 우선순위를 부여합니다.
    const priorityMap = {
        // 제주특별자치도 (최상위 우선순위)
        '제주특별자치도': 1000,
        '제주시': 950,
        '서귀포시': 930,

        // 제주시 행정동/읍/면 (상대적 중요도 및 인구수 고려, KMA 자주 사용 지역)
        '연동': 900, '노형동': 890, '아라동': 880, '이도2동': 870, '일도2동': 860,
        '삼양동': 850, '화북동': 840, '이도1동': 830, '일도1동': 820,
        '삼도1동': 810, '삼도2동': 800, '건입동': 790, '오라동': 780,
        '외도동': 770, '이호동': 760, '도두동': 750, '봉개동': 740,
        '한림읍': 730, '애월읍': 720, '구좌읍': 710, '조천읍': 700,
        '우도면': 690, '추자면': 680, '한경면': 670,

        // 서귀포시 행정동/읍/면 (상대적 중요도 및 인구수 고려, KMA 자주 사용 지역)
        '중문동': 900, '동홍동': 890, '서홍동': 880, '대륜동': 870,
        '천지동': 860, '정방동': 850, '중앙동': 840, '효돈동': 830,
        '영천동': 820, '대천동': 810, '예래동': 800,
        '성산읍': 730, '대정읍': 720, '남원읍': 710, '표선면': 700, '안덕면': 690,

        // 제주 주요 관광지/별칭 (관광지는 행정구역보다 낮은 우선순위)
        '성산일출봉': 700, // 성산읍보다 약간 낮은 우선순위
        '한라산': 800,
        '제주공항': 920,
        '서귀포 매일올레시장': 650,
        '협재해수욕장': 600,
        '새별오름': 580,
        '만장굴': 570,
        '천지연폭포': 560,
        '정방폭포': 550,
        '용머리해안': 540,
        '섭지코지': 530,
        '우도': 520, // 우도면과 중복되지만, 별칭으로 명시적 추가
        '카멜리아힐': 510,
        '테디베어뮤지엄': 500,
        '제주러브랜드': 490,

        // 기타 국립공원 (별도 추가 요청 가능성을 위해 우선순위 유지)
        '지리산국립공원': 800, '북한산국립공원': 790, '계룡산국립공원': 780,
        '설악산국립공원': 770, '오대산국립공원': 760, '주왕산국립공원': 750,
        '내장산국립공원': 740, '가야산국립공원': 730, '덕유산국립공원': 720,
        '월악산국립공원': 710, '소백산국립공원': 700, '치악산국립공원': 690,
        // 기타 전국 주요도시는 별도로 관리될 예정이므로, 이곳에서는 우선순위만 정의.
        // 예를 들어, '서울특별시': 1000, '부산광역시': 980 등은 여기에 남아있어야 합니다.
        '서울특별시': 1000, '종로구': 900, '중구': 900, '용산구': 900, '성동구': 900, '광진구': 900,
        '동대문구': 900, '중랑구': 900, '성북구': 900, '강북구': 900, '도봉구': 900,
        '노원구': 900, '은평구': 900, '서대문구': 900, '마포구': 900, '양천구': 900,
        '강서구': 900, '구로구': 900, '금천구': 900, '영등포구': 900, '동작구': 900,
        '관악구': 900, '서초구': 900, '강남구': 900, '송파구': 900, '강동구': 900,
        '명동': 850, '홍대': 850, '강남': 850, '이태원': 850, '잠실': 850,
        '여의도': 850, '신촌': 850, '동대문': 850, '종로': 850, '종각': 850,
        '경복궁': 850, '남산타워': 850, '남대문시장': 840, '광장시장': 830,
        '가로수길': 830, '코엑스': 830, '인사동': 840, '청담동': 830, '압구정': 830,
        '건대': 820, '신림': 820, '노량진': 820, '왕십리': 820, '합정': 820,
        '부산광역시': 980, '해운대구': 880, '광안리': 840, '서면': 840, '남포동': 840, '태종대': 830, '기장군': 820,
        '자갈치시장': 800, '국제시장': 790, '부산역': 780, '광복로': 770, '범어사': 760,
        '벡스코': 750, '부산항': 740, '깡통시장': 730, '송도해수욕장': 720, '광안대교': 710,
        '감천문화마을': 700, '용두산공원': 690, '부산대학교': 680, '동백섬': 670,
        '기장읍': 810, '장안읍': 810, '정관읍': 810, '일광읍': 810, '철마면': 810,
        '중앙동': 780, '동광동': 770, '대청동': 760, '보수동': 750, '부평동': 740,
        '광복동': 730, '영주제1동': 720, '영주제2동': 710, '동대신제1동': 700,
        '서대신제1동': 700, '아미동': 690, '초장동': 680, '충무동': 670,
        '남부민제1동': 660, '암남동': 650, '초량제1동': 640, '수정제1동': 630,
        '좌천동': 620, '범일제1동': 610, '남항동': 600, '영선제1동': 590,
        '신선동': 580, '봉래제1동': 570, '청학제1동': 560, '동삼제1동': 550,
        '부전제1동': 540, '연지동': 530, '초읍동': 520, '양정제1동': 510,
        '전포제1동': 500, '부암제1동': 490, '당감제1동': 480, '가야제1동': 470,
        '개금제1동': 460, '범천제1동': 450, '수민동': 440, '복산동': 430,
        '명륜동': 420, '온천제1동': 410, '사직제1동': 400, '안락제1동': 390,
        '명장제1동': 380, '대연제1동': 370, '용호제1동': 360, '용당동': 350,
        '감만제1동': 340, '우암동': 330, '문현제1동': 320, '구포제1동': 310,
        '금곡동': 300, '화명제1동': 290, '덕천제1동': 280, '만덕제1동': 270,
        '우제1동': 260, '중제1동': 250, '좌제1동': 240, '송정동': 230,
        '반여제1동': 220, '반송제1동': 210, '재송제1동': 200, '괴정제1동': 190,
        '당리동': 180, '하단제1동': 170, '신평제1동': 160, '장림제1동': 150,
        '다대제1동': 140, '구평동': 130, '감천제1동': 120, '서제1동': 110,
        '금사회동동': 100, '부곡제1동': 90, '장전제1동': 80, '선두구동': 70,
        '청룡노포동': 60, '남산동': 50, '금성동': 40, '대저1동': 30,
        '강동동': 20, '명지1동': 10, '가락동': 5, '녹산동': 4,
        '가덕도동': 3, '신호동': 2, '거제제1동': 1, '연산제1동': 0,
        '남천제1동': -1, '수영동': -2, '망미제1동': -3, '민락동': -4,
        '광안1동': -5, '광안리해수욕장': 840,
        '덕천제2동': 280,
        '용호제2동': 360,
        '대구광역시': 970, '중구대구': 880, '동구대구': 880, '서구대구': 880, '남구대구': 880, '북구': 880,
        '수성구': 870, '달서구': 880, '달성군': 810, '군위군': 800,
        '동성로': 830, '팔공산': 820, '수성못': 820, '서문시장': 830,
        '김광석다시그리기길': 800, '앞산': 790, '대구역': 780, '동대구역': 770,
        '화원읍': 805, '논공읍': 805, '다사읍': 805, '유가읍': 805, '옥포읍': 805,
        '현풍읍': 805, '가창면': 805, '하빈면': 805, '구지면': 805,
        '군위읍': 795, '소보면': 795, '효령면': 795, '부계면': 795, '우보면': 795,
        '의흥면': 795, '산성면': 795, '삼국유사면': 795,
        '인천광역시': 960, '중구인천': 880, '동구인천': 880, '미추홀구': 880, '연수구': 870, '남동구': 880,
        '부평구': 880, '계양구': 880, '서구인천': 880, '강화군': 830, '옹진군': 800,
        '송도': 850, '월미도': 840, '을왕리': 820, '인천공항': 900, '차이나타운': 810,
        '송도국제도시': 840, '청라': 830, '검단': 820, '부평역': 810, '구월동': 800,
        '강화읍': 825, '선원면': 820, '불은면': 820, '길상면': 820, '하점면': 820,
        '양도면': 820, '내가면': 820, '하음면': 820, '송해면': 820, '교동면': 820,
        '삼산면': 820, '서도면': 820, '북도면': 820, '양사면': 820,
        '광주광역시': 950, '동구광주': 880, '서구광주': 880, '남구광주': 880, '북구광주': 880, '광산구': 870,
        '무등산': 850, '충장로': 830, '상무지구': 820, '첨단지구': 810, '광주역': 800,
        '518민주광장': 790, '양동시장': 780, '국립아시아문화전당': 770,
        '대전광역시': 940, '동구대전': 880, '중구대전': 880, '서구대전': 880, '유성구': 850, '대덕구': 880,
        '둔산동': 830, '유성온천': 820, '대전역': 810, '서대전역': 800, '엑스포과학공원': 790,
        '한밭수목원': 780, '계룡산': 770, 'KAIST': 760,
        '울산광역시': 930, '중구울산': 880, '남구울산': 880, '동구울산': 880, '북구울산': 880, '울주군': 820,
        '태화강': 830, '울산대공원': 820, '일산해수욕장': 810, '울산역': 800,
        '현대중공업': 790, '울산석유화학단지': 780,
        '언양읍': 815, '온양읍': 815, '범서읍': 815, '청량읍': 815, '온산읍': 815,
        '웅촌면': 810, '두동면': 810, '두서면': 810, '상북면': 810, '삼남면': 810,
        '삼동면': 810, '서생면': 810,
        '세종특별자치시': 920, '세종시청': 850, '조치원': 840, '연기군': 830, '공주대학교': 820,
        '경기도': 890, '수원시': 800, '성남시': 800, '용인시': 800, '안양시': 800, '안산시': 800,
        '고양시': 800, '화성시': 800, '평택시': 800, '남양주시': 800, '부천시': 800,
        '의정부시': 790, '광명시': 790, '시흥시': 790, '김포시': 790, '군포시': 790,
        '하남시': 790, '오산시': 790, '이천시': 780, '안성시': 780, '구리시': 780,
        '의왕시': 780, '양주시': 780, '동두천시': 770, '과천시': 770, '가평군': 760,
        '양평군': 760, '여주시': 760, '포천시': 750, '연천군': 740,
        '판교': 830, '분당': 830, '일산': 820, '수지': 820, '동탄': 820,
        '광교': 810, '킨텍스': 800, '에버랜드': 790, '한국민속촌': 780, '수원화성': 770,
        '파주출판도시': 760, '헤이리': 750, '임진각': 740, 'DMZ': 730,
        '강원특별자치도': 900, '춘천시': 800, '원주시': 800, '강릉시': 800, '속초시': 800, '동해시': 780,
        '태백시': 770, '삼척시': 770, '홍천군': 760, '횡성군': 750, '영월군': 750,
        '평창군': 740, '정선군': 740, '철원군': 730, '화천군': 730, '양구군': 720,
        '인제군': 720, '고성군': 710, '양양군': 710,
        '설악산국립공원': 750, '오대산국립공원': 740, '정동진': 730, '낙산사': 720,
        '대관령': 710, '평창올림픽파크': 700, '알펜시아': 690, '용평리조트': 680,
        '남이섬': 670, '소양강댐': 660, '청평사': 650, '경포대': 640,
        '충청북도': 880, '청주시': 780, '충주시': 770, '제천시': 760, '보은군': 740, '옥천군': 740,
        '영동군': 730, '증평군': 730, '진천군': 730, '괴산군': 720, '음성군': 720,
        '단양군': 720,
        '월악산': 750, '단양팔경': 740, '충주호': 730, '소백산': 720, '청남대': 710,
        '고수동굴': 700, '온달관광지': 690, '제천의림지': 680,
        '충청남도': 870, '천안시': 770, '공주시': 760, '보령시': 750, '아산시': 750, '서산시': 740,
        '논산시': 730, '계룡시': 730, '당진시': 730, '금산군': 720, '부여군': 720,
        '서천군': 710, '청양군': 710, '홍성군': 710, '예산군': 710, '태안군': 720,
        '태안 안면도': 710, '보령머드축제': 700, '공주무령왕릉': 690, '부여백제문화단지': 680,
        '독립기념관': 670, '온양온천': 660, '덕산온천': 650, '서산마애삼존불': 640,
        '전라북도': 860, '전주시': 760, '군산시': 750, '익산시': 740, '정읍시': 730, '남원시': 720,
        '김제시': 720, '완주군': 710, '진안군': 700, '무주군': 700, '장수군': 690,
        '임실군': 690, '순창군': 690, '고창군': 690, '부안군': 680,
        '전주 한옥마을': 710, '내장산': 700, '덕유산': 690, '마이산': 680, '변산반도': 670,
        '고창갯벌': 660, '무주리조트': 650, '군산근대역사박물관': 640,
        '전라남도': 850, '목포시': 750, '여수시': 740, '순천시': 730, '나주시': 720, '광양시': 710,
        '담양군': 700, '곡성군': 690, '구례군': 690, '고흥군': 680, '보성군': 680,
        '화순군': 680, '장흥군': 670, '강진군': 670, '해남군': 670, '영암군': 670,
        '무안군': 670, '함평군': 660, '영광군': 660, '장성군': 660, '완도군': 650,
        '진도군': 650, '신안군': 640,
        '여수 엑스포': 700, '보성 녹차밭': 690, '순천만': 680, '담양 죽녹원': 670,
        '목포 유달산': 660, '완도 청산도': 650, '진도 울돌목': 640, '해남 땅끝마을': 630,
        '경상북도': 840, '포항시': 740, '경주시': 730, '안동시': 720, '구미시': 710, '영주시': 700,
        '영천시': 690, '상주시': 690, '문경시': 680, '경산시': 680, '군위군': 670,
        '의성군': 670, '청송군': 660, '영양군': 660, '영덕군': 660, '청도군': 650,
        '고령군': 650, '성주군': 650, '칠곡군': 650, '예천군': 640, '봉화군': 640,
        '울진군': 640, '울릉군': 630,
        '경주 역사유적지구': 690, '안동 하회마을': 680, '포항제철소': 670, '불국사': 660,
        '석굴암': 650, '도산서원': 640, '주왕산': 630, '울릉도': 620, '독도': 610,
        '경상남도': 830, '창원시': 730, '진주시': 720, '통영시': 710, '사천시': 700, '김해시': 700,
        '밀양시': 690, '거제시': 690, '양산시': 680, '의령군': 670, '함안군': 670,
        '창녕군': 660, '고성군': 660, '남해군': 650, '하동군': 650, '산청군': 640,
        '함양군': 640, '거창군': 640, '합천군': 630,
        '통영 케이블카': 680, '거제 외도': 670, '남해 독일마을': 660, '진주성': 650,
        '하동 화개장터': 640, '함양 상림': 630, '지리산': 620, '가야산': 610,
    };

    /**
     * 지역 데이터를 추가하는 헬퍼 함수
     * @param {string} key - 데이터 객체의 키 (주로 지역명)
     * @param {Object} locationObj - 지역 상세 정보 객체
     * @param {string} [overrideName] - 실제 저장될 `name` 값 (별칭의 경우 원본 지역의 name 사용)
     */
    const addLocation = (key, locationObj, overrideName = null) => {
        const { lat, lon, name, type, admin_parent, legal_divisions, aliases } = locationObj;
        const { nx, ny } = latLonToGrid(lat, lon);
        
        // 실제 저장될 지역명. overrideName이 있으면 사용하고, 아니면 locationObj의 name 사용.
        const finalName = overrideName || name;
        const finalPriority = priorityMap[key] || 0; // 키에 해당하는 우선순위 사용

        // 이미 더 높은 우선순위의 동일한 키가 있으면 덮어쓰지 않음
        if (data[key] && data[key].priority_score && data[key].priority_score >= finalPriority) {
            return;
        }

        data[key] = {
            name: finalName,
            lat: lat,
            lon: lon,
            kma_nx: nx,
            kma_ny: ny,
            type: type,
            admin_parent: admin_parent,
            legal_divisions: legal_divisions || [], // 법정동/리 목록
            aliases: aliases || [],
            priority_score: finalPriority
        };

        // 별칭도 데이터에 추가 (공식 명칭보다 낮은 우선순위로, 원본 객체 참조)
        (aliases || []).forEach(alias => {
            const aliasPriority = (priorityMap[alias] || 0) || (finalPriority - 10); // 별칭 기본 우선순위
            if (!data[alias] || data[alias].priority_score < aliasPriority) {
                // 별칭은 원본 지역 데이터를 참조하도록 하여 메모리 효율성을 높임
                data[alias] = data[key]; 
                // 참조된 객체에 별칭의 우선순위를 직접 저장 (findMatches에서 활용)
                data[alias].priority = aliasPriority; 
            }
        });

        // legal_divisions에 포함된 법정동/리도 검색 가능하도록 별칭으로 추가
        (legal_divisions || []).forEach(legalDiv => {
            // 법정동/리 이름 자체를 키로 사용하되, 해당 행정동 객체를 참조하도록 함.
            // 이는 법정동/리를 검색했을 때 해당 행정동의 정보가 나오도록 하기 위함.
            // 단, 법정동/리 이름이 이미 다른 (더 높은 우선순위의) 행정동 키로 존재하면 덮어쓰지 않음
            const legalDivPriority = finalPriority - 50; // 법정동은 행정동보다 낮은 우선순위
            if (!data[legalDiv] || data[legalDiv].priority_score < legalDivPriority) { 
                data[legalDiv] = data[key];
                data[legalDiv].priority = legalDivPriority; // 참조된 객체에 우선순위 저장
            }
        });
    };




 // 서울특별시 데이터 (종로구만 포함)

    // 서울특별시
    addLocation('서울특별시', { lat: 37.5665, lon: 126.9780, name: '서울특별시', type: '광역자치단체', aliases: ['서울', '서울시'] });

    // 종로구 및 하위 동
    addLocation('종로구', { lat: 37.5735, lon: 126.9788, name: '서울특별시 종로구', type: '기초자치단체', admin_parent: '서울특별시', aliases: ['종로'] });
    addLocation('청운효자동', { lat: 37.5852, lon: 126.9691, name: '서울특별시 종로구 청운효자동', type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['청운동', '효자동', '궁정동', '신교동', '창성동', '통인동', '누하동', '옥인동', '필운동', '내자동'], aliases: [] });
    addLocation('사직동', { lat: 37.5746, lon: 126.9702, name: '서울특별시 종로구 사직동', type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['사직동', '내수동', '도렴동', '당주동', '신문로1가', '신문로2가', '세종로'], aliases: [] });
    addLocation('삼청동', { lat: 37.5898, lon: 126.9806, name: '서울특별시 종로구 삼청동', type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['삼청동', '팔판동', '안국동', '화동'], aliases: [] });
    addLocation('평창동', { lat: 37.6080, lon: 126.9670, name: '서울특별시 종로구 평창동', type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['평창동'], aliases: [] });
    addLocation('가회동', { lat: 37.5830, lon: 126.9890, name: '서울특별시 종로구 가회동', type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['가회동', '재동', '계동', '원서동'], aliases: [] });
    addLocation('종로1.2.3.4가동', { lat: 37.5710, lon: 126.9910, name: '서울특별시 종로구 종로1.2.3.4가동', type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['종로1가', '종로2가', '종로3가', '종로4가', '인사동', '관철동', '관수동', '견지동', '공평동', '와룡동', '운니동', '익선동', '돈화문로'], aliases: [] });
    addLocation('혜화동', { lat: 37.5810, lon: 127.0000, name: '서울특별시 종로구 혜화동', type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['혜화동', '명륜1가', '명륜2가', '동숭동'], aliases: [] });
    addLocation('창신1동', { lat: 37.5780, lon: 127.0100, name: '서울특별시 종로구 창신1동', type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['창신동'], aliases: [] });
    addLocation('숭인1동', { lat: 37.5750, lon: 127.0200, name: '서울특별시 종로구 숭인1동', type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['숭인동'], aliases: [] });


    
    // =============================================================
    // 제주특별자치도 (광역자치단체)
    addLocation('제주특별자치도', {
        lat: 33.4891, lon: 126.5135, name: '제주특별자치도', type: '광역자치단체',
        aliases: ['제주', '제주도'],
        priority_score: priorityMap['제주특별자치도']
    });

    // =============================================================
    // 제주시 (기초자치단체)
    addLocation('제주시', {
        lat: 33.5073, lon: 126.5148, name: '제주특별자치시 제주시', type: '기초자치단체', admin_parent: '제주특별자치도',
        aliases: [],
        priority_score: priorityMap['제주시']
    });

    // 제주시 행정동
    addLocation('일도1동', {
        lat: 33.5130, lon: 126.5270, name: '제주특별자치시 제주시 일도1동', type: '행정동', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['일도일동'], aliases: [], priority_score: priorityMap['일도1동']
    });
    addLocation('일도2동', {
        lat: 33.5078, lon: 126.5362, name: '제주특별자치시 제주시 일도2동', type: '행정동', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['일도이동'], aliases: [], priority_score: priorityMap['일도2동']
    });
    addLocation('이도1동', {
        lat: 33.5060, lon: 126.5180, name: '제주특별자치시 제주시 이도1동', type: '행정동', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['이도일동'], aliases: [], priority_score: priorityMap['이도1동']
    });
    addLocation('이도2동', {
        lat: 33.4975, lon: 126.5337, name: '제주특별자치시 제주시 이도2동', type: '행정동', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['이도이동', '도남동', '영평동', '오등동'], aliases: ['도남'], priority_score: priorityMap['이도2동']
    }); // 영평동, 오등동은 현재 이도2동 관할 (법정동)
    addLocation('삼도1동', {
        lat: 33.5113, lon: 126.5120, name: '제주특별자치시 제주시 삼도1동', type: '행정동', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['삼도일동'], aliases: [], priority_score: priorityMap['삼도1동']
    });
    addLocation('삼도2동', {
        lat: 33.5090, lon: 126.5080, name: '제주특별자치시 제주시 삼도2동', type: '행정동', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['삼도이동'], aliases: [], priority_score: priorityMap['삼도2동']
    });
    addLocation('건입동', {
        lat: 33.5140, lon: 126.5360, name: '제주특별자치시 제주시 건입동', type: '행정동', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['건입동'], aliases: [], priority_score: priorityMap['건입동']
    });
    addLocation('화북동', {
        lat: 33.5210, lon: 126.5700, name: '제주특별자치시 제주시 화북동', type: '행정동', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['화북일동', '화북이동'], aliases: [], priority_score: priorityMap['화북동']
    });
    addLocation('삼양동', {
        lat: 33.5260, lon: 126.6010, name: '제주특별자치시 제주시 삼양동', type: '행정동', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['삼양일동', '삼양이동', '삼양삼동'], aliases: [], priority_score: priorityMap['삼양동']
    });
    addLocation('봉개동', {
        lat: 33.4590, lon: 126.6190, name: '제주특별자치시 제주시 봉개동', type: '행정동', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['봉개동'], aliases: [], priority_score: priorityMap['봉개동']
    });
    addLocation('아라동', {
        lat: 33.4680, lon: 126.5490, name: '제주특별자치시 제주시 아라동', type: '행정동', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['아라일동', '아라이동'], aliases: [], priority_score: priorityMap['아라동']
    });
    addLocation('오라동', {
        lat: 33.4800, lon: 126.4990, name: '제주특별자치시 제주시 오라동', type: '행정동', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['오라일동', '오라이동', '오라삼동'], aliases: [], priority_score: priorityMap['오라동']
    });
    addLocation('연동', {
        lat: 33.4890, lon: 126.4900, name: '제주특별자치시 제주시 연동', type: '행정동', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['연동'], aliases: [], priority_score: priorityMap['연동']
    });
    addLocation('노형동', {
        lat: 33.4850, lon: 126.4670, name: '제주특별자치시 제주시 노형동', type: '행정동', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['노형동'], aliases: [], priority_score: priorityMap['노형동']
    });
    addLocation('외도동', {
        lat: 33.5040, lon: 126.4490, name: '제주특별자치시 제주시 외도동', type: '행정동', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['외도일동', '외도이동', '외도삼동'], aliases: [], priority_score: priorityMap['외도동']
    });
    addLocation('이호동', {
        lat: 33.5130, lon: 126.4710, name: '제주특별자치시 제주시 이호동', type: '행정동', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['이호일동', '이호이동'], aliases: [], priority_score: priorityMap['이호동']
    });
    addLocation('도두동', {
        lat: 33.5160, lon: 126.4350, name: '제주특별자치시 제주시 도두동', type: '행정동', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['도두일동', '도두이동'], aliases: [], priority_score: priorityMap['도두동']
    });

    // 제주시 읍·면
    addLocation('애월읍', {
        lat: 33.4560, lon: 126.3300, name: '제주특별자치시 제주시 애월읍', type: '읍', admin_parent: '제주특별자치시 제주시',
        legal_divisions: [
            '고내리', '고성리', '곽지리', '광령리', '구엄리', '금성리', '납읍리', '봉성리',
            '상가리', '상귀리', '소길리', '수산리', '애월리', '어음리', '신엄리', '유수암리'
        ], aliases: [], priority_score: priorityMap['애월읍']
    });
    addLocation('한림읍', {
        lat: 33.4140, lon: 126.2570, name: '제주특별자치시 제주시 한림읍', type: '읍', admin_parent: '제주특별자치시 제주시',
        legal_divisions: [
            '귀덕리', '금능리', '금악리', '대림리', '동명리', '명월리', '상대리', '상명리',
            '수원리', '옹포리', '월령리', '월림리', '한림리', '한수리', '협재리'
        ], aliases: [], priority_score: priorityMap['한림읍']
    });
    addLocation('구좌읍', {
        lat: 33.5180, lon: 126.8370, name: '제주특별자치시 제주시 구좌읍', type: '읍', admin_parent: '제주특별자치시 제주시',
        legal_divisions: [
            '김녕리', '덕천리', '동복리', '상도리', '세화리', '송당리', '월정리', '종달리',
            '평대리', '하도리', '한동리', '행원리'
        ], aliases: [], priority_score: priorityMap['구좌읍']
    });
    addLocation('조천읍', {
        lat: 33.5320, lon: 126.6800, name: '제주특별자치시 제주시 조천읍', type: '읍', admin_parent: '제주특별자치시 제주시',
        legal_divisions: [
            '교래리', '대흘리', '북촌리', '선흘리', '신촌리', '신흥리', '와산리', '와흘리',
            '조천리', '함덕리'
        ], aliases: [], priority_score: priorityMap['조천읍']
    });
    addLocation('한경면', {
        lat: 33.3280, lon: 126.1730, name: '제주특별자치시 제주시 한경면', type: '면', admin_parent: '제주특별자치시 제주시',
        legal_divisions: [
            '고산리', '금등리', '낙천리', '두모리', '신창리', '용수리', '저지리', '조수리',
            '청수리', '판포리'
        ], aliases: [], priority_score: priorityMap['한경면']
    });
    addLocation('추자면', {
        lat: 33.9500, lon: 126.3200, name: '제주특별자치시 제주시 추자면', type: '면', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['대서리', '묵리', '신양리', '영흥리', '예초리'], aliases: ['추자'], priority_score: priorityMap['추자면']
    });
    addLocation('우도면', {
        lat: 33.5040, lon: 126.9530, name: '제주특별자치시 제주시 우도면', type: '면', admin_parent: '제주특별자치시 제주시',
        legal_divisions: ['연평리'], aliases: ['우도'], priority_score: priorityMap['우도면']
    });


    // =============================================================
    // 서귀포시 (기초자치단체)
    addLocation('서귀포시', {
        lat: 33.2540, lon: 126.5600, name: '제주특별자치시 서귀포시', type: '기초자치단체', admin_parent: '제주특별자치도',
        aliases: ['서귀포'],
        priority_score: priorityMap['서귀포시']
    });

    // 서귀포시 행정동
    addLocation('정방동', {
        lat: 33.2490, lon: 126.5690, name: '제주특별자치시 서귀포시 정방동', type: '행정동', admin_parent: '제주특별자치시 서귀포시',
        legal_divisions: ['서귀동'], aliases: [], priority_score: priorityMap['정방동']
    });
    addLocation('중앙동', {
        lat: 33.2500, lon: 126.5630, name: '제주특별자치시 서귀포시 중앙동', type: '행정동', admin_parent: '제주특별자치시 서귀포시',
        legal_divisions: ['서귀동'], aliases: [], priority_score: priorityMap['중앙동']
    });
    addLocation('천지동', {
        lat: 33.2470, lon: 126.5560, name: '제주특별자치시 서귀포시 천지동', type: '행정동', admin_parent: '제주특별자치시 서귀포시',
        legal_divisions: ['서귀동', '서홍동'], aliases: [], priority_score: priorityMap['천지동']
    });
    addLocation('효돈동', {
        lat: 33.2800, lon: 126.6100, name: '제주특별자치시 서귀포시 효돈동', type: '행정동', admin_parent: '제주특별자치시 서귀포시',
        legal_divisions: ['하효동', '신효동'], aliases: [], priority_score: priorityMap['효돈동']
    });
    addLocation('영천동', {
        lat: 33.2850, lon: 126.5800, name: '제주특별자치시 서귀포시 영천동', type: '행정동', admin_parent: '제주특별자치시 서귀포시',
        legal_divisions: ['토평동', '서귀동'], aliases: [], priority_score: priorityMap['영천동']
    });
    addLocation('동홍동', {
        lat: 33.2700, lon: 126.5750, name: '제주특별자치시 서귀포시 동홍동', type: '행정동', admin_parent: '제주특별자치시 서귀포시',
        legal_divisions: ['동홍동'], aliases: [], priority_score: priorityMap['동홍동']
    });
    addLocation('서홍동', {
        lat: 33.2600, lon: 126.5400, name: '제주특별자치시 서귀포시 서홍동', type: '행정동', admin_parent: '제주특별자치시 서귀포시',
        legal_divisions: ['서홍동'], aliases: [], priority_score: priorityMap['서홍동']
    });
    addLocation('대륜동', {
        lat: 33.2450, lon: 126.5200, name: '제주특별자치시 서귀포시 대륜동', type: '행정동', admin_parent: '제주특별자치시 서귀포시',
        legal_divisions: ['법환동', '서호동', '호근동'], aliases: [], priority_score: priorityMap['대륜동']
    });
    addLocation('대천동', {
        lat: 33.2580, lon: 126.4900, name: '제주특별자치시 서귀포시 대천동', type: '행정동', admin_parent: '제주특별자치시 서귀포시',
        legal_divisions: ['강정동', '도순동', '영남동', '월평동'], aliases: [], priority_score: priorityMap['대천동']
    });
    addLocation('중문동', {
        lat: 33.2440, lon: 126.4300, name: '제주특별자치시 서귀포시 중문동', type: '행정동', admin_parent: '제주특별자치시 서귀포시',
        legal_divisions: ['중문동', '대포동', '하원동', '회수동'], aliases: [], priority_score: priorityMap['중문동']
    });
    addLocation('예래동', {
        lat: 33.2480, lon: 126.3800, name: '제주특별자치시 서귀포시 예래동', type: '행정동', admin_parent: '제주특별자치시 서귀포시',
        legal_divisions: ['예래동', '상예동', '하예동'], aliases: [], priority_score: priorityMap['예래동']
    });

    // 서귀포시 읍·면
    addLocation('대정읍', {
        lat: 33.2260, lon: 126.2570, name: '제주특별자치시 서귀포시 대정읍', type: '읍', admin_parent: '제주특별자치시 서귀포시',
        legal_divisions: [
            '하모리', '상모리', '신평리', '영락리', '무릉리', '보성리', '안성리', '구억리',
            '인성리', '일과리', '동일1리', '동일2리', '가파리', '마라리'
        ], aliases: [], priority_score: priorityMap['대정읍']
    });
    addLocation('남원읍', {
        lat: 33.2800, lon: 126.7300, name: '제주특별자치시 서귀포시 남원읍', type: '읍', admin_parent: '제주특별자치시 서귀포시',
        legal_divisions: [
            '남원리', '위미리', '태흥리', '한남리', '의귀리', '신례리', '하례리'
        ], aliases: [], priority_score: priorityMap['남원읍']
    });
    addLocation('성산읍', {
        lat: 33.3800, lon: 126.8900, name: '제주특별자치시 서귀포시 성산읍', type: '읍', admin_parent: '제주특별자치시 서귀포시',
        legal_divisions: [
            '성산리', '고성리', '온평리', '신풍리', '수산리', '신천리', '삼달리', '오조리', '시흥리'
        ], aliases: ['성산일출봉'], // 성산일출봉을 성산읍의 별칭으로 추가
        priority_score: priorityMap['성산읍']
    });
    addLocation('안덕면', {
        lat: 33.2500, lon: 126.3100, name: '제주특별자치시 서귀포시 안덕면', type: '면', admin_parent: '제주특별자치시 서귀포시',
        legal_divisions: [
            '화순리', '감산리', '서광리', '동광리', '사계리', '창천리', '상창리', '광평리', '덕수리'
        ], aliases: [], priority_score: priorityMap['안덕면']
    });
    addLocation('표선면', {
        lat: 33.3000, lon: 126.8300, name: '제주특별자치시 서귀포시 표선면', type: '면', admin_parent: '제주특별자치시 서귀포시',
        legal_divisions: [
            '표선리', '세화리', '가시리', '성읍리', '하천리', '토산리'
        ], aliases: [], priority_score: priorityMap['표선면']
    });











    
    // 데이터 로드 확인용 통계 및 메타데이터
    const METADATA = {
        totalLocations: Object.keys(data).length,
        lastUpdated: new Date().toISOString(),
        coverage: {
            cities: new Set(Object.values(data).filter(loc => loc.type === '광역자치단체' || loc.type === '기초자치단체').map(loc => loc.name)).size,
            adminDivisions: new Set(Object.values(data).filter(loc => loc.type === '행정동' || loc.type === '읍' || loc.type === '면').map(loc => loc.name)).size
        }
    };

    return {
        locationData: data, // 실제 데이터 객체
        latLonToGrid,
        
        /**
         * 검색어를 기반으로 지역을 검색하고 페이지네이션을 적용합니다.
         * @param {string} searchTerm - 검색어
         * @param {number} page - 요청 페이지 번호 (1부터 시작)
         * @param {number} pageSize - 페이지당 항목 수
         * @returns {{results: Array<Object>, pagination: Object}} 검색 결과 및 페이지네이션 정보
         */
        searchLocations: (searchTerm, page = 1, pageSize = 10) => {
            const normalizedSearch = searchTerm.trim().toLowerCase();
            const filtered = [];

            // 먼저 모든 매칭되는 지역을 찾고, priority_score로 정렬 (findAllMatches와 유사)
            for (const key in data) {
                const location = data[key];
                const keyLower = key.toLowerCase();
                const nameLower = location.name.toLowerCase();

                if (nameLower.includes(normalizedSearch) ||
                    keyLower.includes(normalizedSearch) ||
                    (location.aliases && location.aliases.some(alias => alias.toLowerCase().includes(normalizedSearch))) ||
                    (location.legal_divisions && location.legal_divisions.some(ld => ld.toLowerCase().includes(normalizedSearch)))
                ) {
                    filtered.push({ ...location, key: key, priority: location.priority_score || 0 });
                }
            }

            // 우선순위가 높은 순으로 정렬
            filtered.sort((a, b) => b.priority - a.priority);

            const totalResults = filtered.length;
            const totalPages = Math.ceil(totalResults / pageSize);
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;

            const results = filtered.slice(startIndex, endIndex);

            return {
                results: results,
                pagination: {
                    currentPage: page,
                    pageSize: pageSize,
                    totalResults: totalResults,
                    totalPages: totalPages
                }
            };
        },

        /**
         * 좌표에 가장 가까운 행정 구역을 찾습니다. (간단한 근접성 판단)
         * 이 함수는 정밀한 지리 공간 분석이 아닌, 가장 가까운 `locationData` 항목을 찾습니다.
         * @param {{lat: number, lon: number}} coords - 위도 및 경도
         * @returns {Object|null} 가장 가까운 지역 객체 또는 null
         */
        findMatchingLocation: (coords) => {
            let closestLocation = null;
            let minDistance = Infinity;

            for (const key in data) {
                const loc = data[key];
                // 광역/기초자치단체, 행정동, 읍, 면만 대상 (관광지 등은 제외)
                if (loc.type && ['광역자치단체', '기초자치단체', '행정동', '읍', '면'].includes(loc.type)) {
                    const distance = Math.sqrt(
                        Math.pow(coords.lat - loc.lat, 2) +
                        Math.pow(coords.lon - loc.lon, 2)
                    );

                    // 거리가 같을 경우 priority_score가 높은 것을 선택
                    if (distance < minDistance || (distance === minDistance && loc.priority_score > (closestLocation ? closestLocation.priority_score : 0))) {
                        minDistance = distance;
                        closestLocation = loc;
                    }
                }
            }
            return closestLocation;
        },

        /**
         * 검색어를 기반으로 매칭되는 모든 지역을 찾고 우선순위에 따라 정렬합니다.
         * 이 함수는 searchLocations와 유사하지만, 페이지네이션 없이 모든 매칭 결과를 반환합니다.
         * @param {string} searchTerm - 검색어
         * @returns {Array<Object>} 매칭되는 지역 객체 배열
         */
        findAllMatches: (searchTerm) => {
            const normalizedSearch = searchTerm.trim().toLowerCase();
            const matches = [];

            for (const key in data) {
                const location = data[key];
                const keyLower = key.toLowerCase();
                const nameLower = location.name.toLowerCase();

                // 이름, 키 또는 별칭, 법정동/리 목록에 검색어가 포함되는 경우
                if (nameLower.includes(normalizedSearch) ||
                    keyLower.includes(normalizedSearch) ||
                    (location.aliases && location.aliases.some(alias => alias.toLowerCase().includes(normalizedSearch))) ||
                    (location.legal_divisions && location.legal_divisions.some(ld => ld.toLowerCase().includes(normalizedSearch)))
                ) {
                    // 깊은 복사를 통해 원본 객체 변경 방지 및 `key`와 `priority` 추가
                    matches.push({ ...location, key: key, priority: location.priority_score || 0 });
                }
            }

            // 우선순위가 높은 순으로 정렬
            return matches.sort((a, b) => {
                const priorityA = a.priority_score !== undefined ? a.priority_score : 0;
                const priorityB = b.priority_score !== undefined ? b.priority_score : 0;

                if (priorityA !== priorityB) {
                    return priorityB - priorityA;
                }
                // 우선순위가 같으면 이름으로 정렬
                return a.name.localeCompare(b.name);
            });
        },

        // 기타 유틸리티 함수 (예: 통계, 메타데이터 등)
        getStatistics: () => {
            let totalLocations = Object.keys(data).length;
            let byType = {};
            let byLevel = {};

            for (const key in data) {
                const loc = data[key];
                byType[loc.type] = (byType[loc.type] || 0) + 1;
                // '시', '군', '구', '읍', '면', '동', '리' 등으로 분류 가능
                const lastWord = loc.name.split(' ').pop();
                byLevel[lastWord] = (byLevel[lastWord] || 0) + 1;
            }

            return { totalLocations, byType, byLevel };
        },
        getMetadata: () => METADATA,
        // (필요 시) 메타데이터 업데이트 함수 등 추가 가능
    };
})(); // 즉시 실행 함수로 locationData 객체 생성 및 초기화

// CommonJS 모듈 내보내기
module.exports = locationData;
