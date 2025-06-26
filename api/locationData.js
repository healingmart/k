/**
 * @file locationData.js
 * @description 전국 (제주도 포함) 지역 정보를 담는 데이터 파일.
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
 * @property {'광역자치단체'|'기초자치단체'|'행정동'|'읍'|'면'|'법정동'|'별칭'} type - 지역 유형
 * @property {string} [admin_parent] - 상위 행정 구역의 공식 명칭 (예: '제주특별자치시 제주시')
 * @property {string[]} [legal_divisions] - 해당 행정 구역이 관할하는 법정동/리 명칭 배열
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
     * @param {Object} locationObj - 지역 상세 정보 객체. kma_nx, kma_ny는 자동으로 계산됩니다.
     * @param {string} locationObj.name - 지역의 공식 명칭
     * @param {number} locationObj.lat - 위도
     * @param {number} locationObj.lon - 경도
     * @param {'광역자치단체'|'기초자치단체'|'행정동'|'읍'|'면'|'법정동'|'별칭'} locationObj.type - 지역 유형
     * @param {string} [locationObj.admin_parent] - 상위 행정 구역의 공식 명칭
     * @param {string[]} [locationObj.legal_divisions] - 해당 행정 구역이 관할하는 법정동/리 명칭 배열
     * @param {string[]} [locationObj.aliases] - 검색을 위한 추가 별칭 배열
     */
    const addLocation = (locationObj) => {
        const { lat, lon, name, type, admin_parent, legal_divisions, aliases } = locationObj;
        
        // 경도 또는 위도가 유효한 숫자가 아니면 함수 실행 중단
        if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) {
            console.error(`Error: Invalid lat/lon for name '${name}'. Lat: ${lat}, Lon: ${lon}`);
            return;
        }

        const { nx: kma_nx, ny: kma_ny } = latLonToGrid(lat, lon);

        // 우선순위는 name 또는 aliases를 기반으로 priorityMap에서 조회
        let finalPriority = priorityMap[name] || 0;
        if (aliases) {
            aliases.forEach(alias => {
                if (priorityMap[alias] && priorityMap[alias] > finalPriority) {
                    finalPriority = priorityMap[alias];
                }
            });
        }
        // 만약 priorityMap에 없는 새로운 지역이라면 기본값 0 또는 낮은 우선순위 부여
        if (finalPriority === 0 && type !== '별칭') { // 별칭이 아닌 일반 지역에 대한 기본 우선순위
            if (type === '광역자치단체') finalPriority = 100;
            else if (type === '기초자치단체') finalPriority = 80;
            else if (type === '행정동' || type === '읍' || type === '면') finalPriority = 60;
            else if (type === '법정동') finalPriority = 40;
        }


        // 데이터 객체의 키는 name 속성을 기반으로 합니다.
        // 이미 더 높은 우선순위의 동일한 키가 있으면 덮어쓰지 않음
        if (data[name] && data[name].priority_score && data[name].priority_score >= finalPriority) {
            return;
        }

        const newLocation = {
            name: name,
            lat: lat,
            lon: lon,
            kma_nx: kma_nx,
            kma_ny: kma_ny,
            type: type,
            admin_parent: admin_parent,
            legal_divisions: legal_divisions || [], // 법정동/리 목록
            aliases: aliases || [],
            priority_score: finalPriority
        };
        data[name] = newLocation;

        // 별칭도 데이터에 추가 (공식 명칭보다 낮은 우선순위로, 원본 객체 참조)
        (aliases || []).forEach(alias => {
            const aliasPriority = (priorityMap[alias] || 0) || (newLocation.priority_score - 10); // 별칭 기본 우선순위
            if (!data[alias] || (data[alias].priority_score !== undefined && data[alias].priority_score < aliasPriority)) {
                // 별칭은 원본 지역 데이터를 참조하도록 하여 메모리 효율성을 높임
                data[alias] = newLocation; 
                // 참조된 객체에 별칭의 우선순위를 직접 저장 (findMatches에서 활용)
                data[alias].priority_score = aliasPriority; 
            }
        });

        // legal_divisions에 포함된 법정동/리도 검색 가능하도록 별칭으로 추가
        (legal_divisions || []).forEach(legalDiv => {
            // 법정동/리 이름 자체를 키로 사용하되, 해당 행정동 객체를 참조하도록 함.
            // 이는 법정동/리를 검색했을 때 해당 행정동의 정보가 나오도록 하기 위함.
            // 단, 법정동/리 이름이 이미 다른 (더 높은 우선순위의) 행정동 키로 존재하면 덮어쓰지 않음
            const legalDivPriority = newLocation.priority_score - 50; // 법정동은 행정동보다 낮은 우선순위
            if (!data[legalDiv] || (data[legalDiv].priority_score !== undefined && data[legalDiv].priority_score < legalDivPriority)) { 
                data[legalDiv] = newLocation;
                data[legalDiv].priority_score = legalDivPriority; // 참조된 객체에 우선순위 저장
            }
        });
    };

    // =============================================================
    // 서울특별시 (광역자치단체)
    addLocation({ name: '서울특별시', lat: 37.5665, lon: 126.9780, type: '광역자치단체', aliases: ['서울', '서울시'] });

    // =============================================================
    // 25개 구 및 주요 행정동/법정동 데이터

    // 종로구 및 하위 동
    addLocation({ name: '서울특별시 종로구', lat: 37.5735, lon: 126.9788, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['종로구'] });
    addLocation({ name: '서울특별시 종로구 청운효자동', lat: 37.5852, lon: 126.9691, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['청운동', '효자동', '궁정동', '신교동', '창성동', '통인동', '누하동', '옥인동', '신교동', '필운동', '내자동'] });
    addLocation({ name: '서울특별시 종로구 사직동', lat: 37.5746, lon: 126.9702, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['사직동', '내수동', '도렴동', '당주동', '신문로1가', '신문로2가', '세종로'] });
    addLocation({ name: '서울특별시 종로구 삼청동', lat: 37.5898, lon: 126.9806, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['삼청동', '팔판동', '안국동', '화동'] });
    addLocation({ name: '서울특별시 종로구 평창동', lat: 37.6080, lon: 126.9670, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['평창동'] });
    addLocation({ name: '서울특별시 종로구 가회동', lat: 37.5830, lon: 126.9890, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['가회동', '재동', '계동', '원서동'] });
    addLocation({ name: '서울특별시 종로구 종로1.2.3.4가동', lat: 37.5710, lon: 126.9910, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['종로1가', '종로2가', '종로3가', '종로4가', '인사동', '관철동', '관수동', '견지동', '공평동', '와룡동', '운니동', '익선동', '돈화문로'] });
    addLocation({ name: '서울특별시 종로구 혜화동', lat: 37.5810, lon: 127.0000, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['혜화동', '명륜1가', '명륜2가', '동숭동'] });
    addLocation({ name: '서울특별시 종로구 창신1동', lat: 37.5780, lon: 127.0100, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['창신동'] });
    addLocation({ name: '서울특별시 종로구 숭인1동', lat: 37.5750, lon: 127.0200, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['숭인동'] });
    addLocation({ name: '서울특별시 종로구 종로1가', lat: 37.5700, lon: 126.9790, type: '별칭', admin_parent: '서울특별시 종로구', aliases: ['종각','종로'] });
    addLocation({ name: '서울특별시 종로구 세종로', lat: 37.5776, lon: 126.9769, type: '별칭', admin_parent: '서울특별시 종로구', aliases: ['경복궁'] });
    addLocation({ name: '서울특별시 종로구 예지동', lat: 37.5709, lon: 127.0006, type: '별칭', admin_parent: '서울특별시 종로구', aliases: ['광장시장'] });
    
    // 중구 및 하위 동
    addLocation({ name: '서울특별시 중구', lat: 37.5630, lon: 126.9970, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['중구'] });
    addLocation({ name: '서울특별시 중구 소공동', lat: 37.5630, lon: 126.9800, type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['소공동', '북창동', '태평로2가'] });
    addLocation({ name: '서울특별시 중구 명동', lat: 37.5610, lon: 126.9860, type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['명동1가', '명동2가', '남산동1가', '남산동2가', '남산동3가', '충무로1가', '충무로2가', '저동1가', '저동2가', '예관동'], aliases: ['명동성당'] });
    addLocation({ name: '서울특별시 중구 을지로동', lat: 37.5650, lon: 126.9910, type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['을지로1가', '을지로2가', '을지로3가', '을지로4가', '을지로5가', '을지로6가', '을지로7가', '수하동', '장교동', '삼각동', '입정동', '산림동', '주교동'] });
    addLocation({ name: '서울특별시 중구 필동', lat: 37.5600, lon: 127.0000, type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['필동1가', '필동2가', '필동3가', '묵정동', '남학동', '주자동', '충무로3가', '충무로4가', '충무로5가', '장충동1가', '장충동2가', '광희동1가', '광희동2가'] });
    addLocation({ name: '서울특별시 중구 장충동', lat: 37.5580, lon: 127.0090, type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['장충동1가', '장충동2가', '묵정동'] });
    addLocation({ name: '서울특별시 중구 신당5동', lat: 37.5680, lon: 127.0180, type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['신당동'] });
    addLocation({ name: '서울특별시 중구 황학동', lat: 37.5710, lon: 127.0150, type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['황학동'] });
    addLocation({ name: '서울특별시 중구 중림동', lat: 37.5590, lon: 126.9670, type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['중림동'] });
    addLocation({ name: '서울특별시 중구 회현동', lat: 37.5580, lon: 126.9770, type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['회현동1가', '회현동2가', '회현동3가', '남산동1가', '남산동2가', '남산동3가', '충무로1가'] });
    addLocation({ name: '서울특별시 중구 남대문로4가', lat: 37.5590, lon: 126.9770, type: '별칭', admin_parent: '서울특별시 중구', aliases: ['남대문시장'] });

    // 용산구 및 하위 동
    addLocation({ name: '서울특별시 용산구', lat: 37.5326, lon: 126.9905, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['용산구'] });
    addLocation({ name: '서울특별시 용산구 후암동', lat: 37.5450, lon: 126.9740, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['후암동'] });
    addLocation({ name: '서울특별시 용산구 용산2가동', lat: 37.5380, lon: 126.9830, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['용산동2가', '용산동3가', '용산동4가', '용산동5가', '용산동6가'] });
    addLocation({ name: '서울특별시 용산구 남영동', lat: 37.5410, lon: 126.9700, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['남영동', '갈월동', '동자동'] });
    addLocation({ name: '서울특별시 용산구 원효로2동', lat: 37.5350, lon: 126.9600, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['원효로2가', '원효로3가', '원효로4가', '산천동', '청암동', '효창동', '용문동'] });
    addLocation({ name: '서울특별시 용산구 이촌1동', lat: 37.5220, lon: 126.9700, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['이촌동'] });
    addLocation({ name: '서울특별시 용산구 이태원1동', lat: 37.5345, lon: 126.9934, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['이태원동', '한남동', '보광동'], aliases: ['이태원'] });
    addLocation({ name: '서울특별시 용산구 한남동', lat: 37.5370, lon: 127.0090, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['한남동', '동빙고동', '서빙고동', '주성동'] });
    addLocation({ name: '서울특별시 용산구 보광동', lat: 37.5310, lon: 127.0060, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['보광동', '주성동'] });
    addLocation({ name: '서울특별시 용산구 청파동', lat: 37.5500, lon: 126.9690, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['청파동1가', '청파동2가', '청파동3가'] });
    addLocation({ name: '서울특별시 용산구 효창동', lat: 37.5400, lon: 126.9600, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['효창동', '용문동'] });
    addLocation({ name: '서울특별시 용산구 서빙고동', lat: 37.5190, lon: 126.9820, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['서빙고동', '동빙고동'] });
    addLocation({ name: '서울특별시 용산구 용문동', lat: 37.5330, lon: 126.9580, type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['용문동'] });
    addLocation({ name: '서울특별시 용산구 이촌동', lat: 37.5190, lon: 126.9740, type: '법정동', admin_parent: '서울특별시 용산구' });
    addLocation({ name: '서울특별시 용산구 용산동2가', lat: 37.5512, lon: 126.9880, type: '별칭', admin_parent: '서울특별시 용산구', aliases: ['남산타워', 'N서울타워'] });

    // 성동구 및 하위 동
    addLocation({ name: '서울특별시 성동구', lat: 37.5635, lon: 127.0365, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['성동구'] });
    addLocation({ name: '서울특별시 성동구 왕십리2동', lat: 37.5660, lon: 127.0290, type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['하왕십리동'] });
    addLocation({ name: '서울특별시 성동구 마장동', lat: 37.5700, lon: 127.0430, type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['마장동'] });
    addLocation({ name: '서울특별시 성동구 사근동', lat: 37.5600, lon: 127.0400, type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['사근동'] });
    addLocation({ name: '서울특별시 성동구 행당1동', lat: 37.5580, lon: 127.0270, type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['행당동'] });
    addLocation({ name: '서울특별시 성동구 응봉동', lat: 37.5460, lon: 127.0370, type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['응봉동'] });
    addLocation({ name: '서울특별시 성동구 금호1가동', lat: 37.5500, lon: 127.0200, type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['금호동1가'] });
    addLocation({ name: '서울특별시 성동구 성수1가1동', lat: 37.5460, lon: 127.0470, type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['성수동1가'] });
    addLocation({ name: '서울특별시 성동구 옥수동', lat: 37.5520, lon: 127.0140, type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['옥수동'] });

    // 광진구 및 하위 동
    addLocation({ name: '서울특별시 광진구', lat: 37.5384, lon: 127.0822, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['광진구'] });
    addLocation({ name: '서울특별시 광진구 화양동', lat: 37.5450, lon: 127.0690, type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['화양동'] });
    addLocation({ name: '서울특별시 광진구 군자동', lat: 37.5500, lon: 127.0760, type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['군자동'] });
    addLocation({ name: '서울특별시 광진구 중곡1동', lat: 37.5680, lon: 127.0850, type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['중곡동'] });
    addLocation({ name: '서울특별시 광진구 능동', lat: 37.5550, lon: 127.0800, type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['능동'] });
    addLocation({ name: '서울특별시 광진구 광장동', lat: 37.5520, lon: 127.1030, type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['광장동'] });
    addLocation({ name: '서울특별시 광진구 구의1동', lat: 37.5370, lon: 127.0880, type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['구의동'] });
    addLocation({ name: '서울특별시 광진구 자양1동', lat: 37.5320, lon: 127.0670, type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['자양동'] });

    // 동대문구 및 하위 동
    addLocation({ name: '서울특별시 동대문구', lat: 37.5744, lon: 127.0394, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['동대문구'] });
    addLocation({ name: '서울특별시 동대문구 용두동', lat: 37.5740, lon: 127.0270, type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['용두동'] });
    addLocation({ name: '서울특별시 동대문구 제기동', lat: 37.5790, lon: 127.0350, type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['제기동'] });
    addLocation({ name: '서울특별시 동대문구 전농1동', lat: 37.5850, lon: 127.0500, type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['전농동'] });
    addLocation({ name: '서울특별시 동대문구 답십리1동', lat: 37.5700, lon: 127.0500, type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['답십리동'] });
    addLocation({ name: '서울특별시 동대문구 장안1동', lat: 37.5700, lon: 127.0660, type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['장안동'] });
    addLocation({ name: '서울특별시 동대문구 청량리동', lat: 37.5900, lon: 127.0480, type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['청량리동'] });
    addLocation({ name: '서울특별시 동대문구 회기동', lat: 37.5940, lon: 127.0560, type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['회기동'] });
    addLocation({ name: '서울특별시 동대문구 휘경1동', lat: 37.5960, lon: 127.0620, type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['휘경동'] });

    // 중랑구 및 하위 동
    addLocation({ name: '서울특별시 중랑구', lat: 37.6063, lon: 127.0925, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['중랑구'] });
    addLocation({ name: '서울특별시 중랑구 면목2동', lat: 37.5890, lon: 127.0880, type: '행정동', admin_parent: '서울특별시 중랑구', legal_divisions: ['면목동'] });
    addLocation({ name: '서울특별시 중랑구 상봉1동', lat: 37.5950, lon: 127.0870, type: '행정동', admin_parent: '서울특별시 중랑구', legal_divisions: ['상봉동'] });
    addLocation({ name: '서울특별시 중랑구 중화1동', lat: 37.6000, lon: 127.0810, type: '행정동', admin_parent: '서울특별시 중랑구', legal_divisions: ['중화동'] });
    addLocation({ name: '서울특별시 중랑구 묵1동', lat: 37.6180, lon: 127.0780, type: '행정동', admin_parent: '서울특별시 중랑구', legal_divisions: ['묵동'] });
    addLocation({ name: '서울특별시 중랑구 망우3동', lat: 37.6060, lon: 127.0970, type: '행정동', admin_parent: '서울특별시 중랑구', legal_divisions: ['망우동'] });
    addLocation({ name: '서울특별시 중랑구 신내1동', lat: 37.6180, lon: 127.0960, type: '행정동', admin_parent: '서울특별시 중랑구', legal_divisions: ['신내동'] });

    // 성북구 및 하위 동
    addLocation({ name: '서울특별시 성북구', lat: 37.5894, lon: 127.0167, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['성북구'] });
    addLocation({ name: '서울특별시 성북구 성북동', lat: 37.5950, lon: 127.0080, type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['성북동'] });
    addLocation({ name: '서울특별시 성북구 삼선동', lat: 37.5850, lon: 127.0130, type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['삼선동1가', '삼선동2가', '삼선동3가', '삼선동4가'] });
    addLocation({ name: '서울특별시 성북구 동선동', lat: 37.5880, lon: 127.0210, type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['동선동1가', '동선동2가', '동선동3가', '동선동4가', '동선동5가'] });
    addLocation({ name: '서울특별시 성북구 돈암1동', lat: 37.5890, lon: 127.0170, type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['돈암동'] });
    addLocation({ name: '서울특별시 성북구 안암동', lat: 37.5870, lon: 127.0300, type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['안암동1가', '안암동2가', '안암동3가', '안암동4가', '안암동5가'] });
    addLocation({ name: '서울특별시 성북구 정릉1동', lat: 37.6000, lon: 127.0100, type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['정릉동'] });
    addLocation({ name: '서울특별시 성북구 길음1동', lat: 37.6050, lon: 127.0240, type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['길음동'] });

    // 강북구 및 하위 동
    addLocation({ name: '서울특별시 강북구', lat: 37.6397, lon: 127.0256, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['강북구'] });
    addLocation({ name: '서울특별시 강북구 미아동', lat: 37.6250, lon: 127.0250, type: '법정동', admin_parent: '서울특별시 강북구' });
    addLocation({ name: '서울특별시 강북구 수유1동', lat: 37.6380, lon: 127.0180, type: '행정동', admin_parent: '서울특별시 강북구', legal_divisions: ['수유동'] });
    addLocation({ name: '서울특별시 강북구 번1동', lat: 37.6300, lon: 127.0400, type: '행정동', admin_parent: '서울특별시 강북구', legal_divisions: ['번동'] });
    addLocation({ name: '서울특별시 강북구 삼각산동', lat: 37.6470, lon: 127.0080, type: '행정동', admin_parent: '서울특별시 강북구', legal_divisions: ['수유동', '우이동'] });
    addLocation({ name: '서울특별시 강북구 우이동', lat: 37.6600, lon: 127.0180, type: '법정동', admin_parent: '서울특별시 강북구' });

    // 도봉구 및 하위 동
    addLocation({ name: '서울특별시 도봉구', lat: 37.6688, lon: 127.0471, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['도봉구'] });
    addLocation({ name: '서울특별시 도봉구 쌍문1동', lat: 37.6490, lon: 127.0340, type: '행정동', admin_parent: '서울특별시 도봉구', legal_divisions: ['쌍문동'] });
    addLocation({ name: '서울특별시 도봉구 방학1동', lat: 37.6680, lon: 127.0380, type: '행정동', admin_parent: '서울특별시 도봉구', legal_divisions: ['방학동'] });
    addLocation({ name: '서울특별시 도봉구 창2동', lat: 37.6480, lon: 127.0560, type: '행정동', admin_parent: '서울특별시 도봉구', legal_divisions: ['창동'] });
    addLocation({ name: '서울특별시 도봉구 도봉1동', lat: 37.6850, lon: 127.0450, type: '행정동', admin_parent: '서울특별시 도봉구', legal_divisions: ['도봉동'] });

    // 노원구 및 하위 동
    addLocation({ name: '서울특별시 노원구', lat: 37.6541, lon: 127.0568, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['노원구'] });
    addLocation({ name: '서울특별시 노원구 월계1동', lat: 37.6180, lon: 127.0570, type: '행정동', admin_parent: '서울특별시 노원구', legal_divisions: ['월계동'] });
    addLocation({ name: '서울특별시 노원구 공릉1동', lat: 37.6260, lon: 127.0750, type: '행정동', admin_parent: '서울특별시 노원구', legal_divisions: ['공릉동'] });
    addLocation({ name: '서울특별시 노원구 하계1동', lat: 37.6170, lon: 127.0710, type: '행정동', admin_parent: '서울특별시 노원구', legal_divisions: ['하계동'] });
    addLocation({ name: '서울특별시 노원구 중계1동', lat: 37.6370, lon: 127.0700, type: '행정동', admin_parent: '서울특별시 노원구', legal_divisions: ['중계동'] });
    addLocation({ name: '서울특별시 노원구 상계1동', lat: 37.6530, lon: 127.0600, type: '행정동', admin_parent: '서울특별시 노원구', legal_divisions: ['상계동'] });
    addLocation({ name: '서울특별시 노원구 상계동', lat: 37.6800, lon: 127.0700, type: '별칭', admin_parent: '서울특별시 노원구', aliases: ['수락산'] });

    // 은평구 및 하위 동
    addLocation({ name: '서울특별시 은평구', lat: 37.6176, lon: 126.9227, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['은평구'] });
    addLocation({ name: '서울특별시 은평구 녹번동', lat: 37.6100, lon: 126.9360, type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['녹번동'] });
    addLocation({ name: '서울특별시 은평구 불광1동', lat: 37.6150, lon: 126.9300, type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['불광동'] });
    addLocation({ name: '서울특별시 은평구 갈현1동', lat: 37.6250, lon: 126.9050, type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['갈현동'] });
    addLocation({ name: '서울특별시 은평구 구산동', lat: 37.6100, lon: 126.9050, type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['구산동'] });
    addLocation({ name: '서울특별시 은평구 응암1동', lat: 37.5980, lon: 126.9240, type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['응암동'] });
    addLocation({ name: '서울특별시 은평구 역촌동', lat: 37.6050, lon: 126.9120, type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['역촌동'] });
    addLocation({ name: '서울특별시 은평구 진관동', lat: 37.6350, lon: 126.9250, type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['진관동', '구파발동'] });

    // 서대문구 및 하위 동
    addLocation({ name: '서울특별시 서대문구', lat: 37.5791, lon: 126.9368, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['서대문구'] });
    addLocation({ name: '서울특별시 서대문구 천연동', lat: 37.5720, lon: 126.9530, type: '행정동', admin_parent: '서울특별시 서대문구', legal_divisions: ['천연동', '옥천동', '영천동'] });
    addLocation({ name: '서울특별시 서대문구 홍제1동', lat: 37.5880, lon: 126.9400, type: '행정동', admin_parent: '서울특별시 서대문구', legal_divisions: ['홍제동'] });
    addLocation({ name: '서울특별시 서대문구 연희동', lat: 37.5680, lon: 126.9370, type: '행정동', admin_parent: '서울특별시 서대문구', legal_divisions: ['연희동'] });
    addLocation({ name: '서울특별시 서대문구 북가좌1동', lat: 37.5850, lon: 126.9100, type: '행정동', admin_parent: '서울특별시 서대문구', legal_divisions: ['북가좌동'] });
    addLocation({ name: '서울특별시 서대문구 신촌동', lat: 37.5598, lon: 126.9423, type: '행정동', admin_parent: '서울특별시 서대문구', legal_divisions: ['신촌동', '창천동', '대현동', '봉원동'], aliases: ['신촌'] });

    // 마포구 및 하위 동
    addLocation({ name: '서울특별시 마포구', lat: 37.5615, lon: 126.9088, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['마포구'] });
    addLocation({ name: '서울특별시 마포구 공덕동', lat: 37.5450, lon: 126.9520, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['공덕동'] });
    addLocation({ name: '서울특별시 마포구 아현동', lat: 37.5580, lon: 126.9520, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['아현동'] });
    addLocation({ name: '서울특별시 마포구 도화동', lat: 37.5400, lon: 126.9490, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['도화동'] });
    addLocation({ name: '서울특별시 마포구 용강동', lat: 37.5350, lon: 126.9400, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['용강동'] });
    addLocation({ name: '서울특별시 마포구 대흥동', lat: 37.5500, lon: 126.9420, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['대흥동'] });
    addLocation({ name: '서울특별시 마포구 염리동', lat: 37.5520, lon: 126.9490, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['염리동'] });
    addLocation({ name: '서울특별시 마포구 신수동', lat: 37.5480, lon: 126.9300, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['신수동'] });
    addLocation({ name: '서울특별시 마포구 서교동', lat: 37.5577, lon: 126.9248, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['서교동', '동교동', '합정동'], aliases: ['홍대', '홍대입구'] });
    addLocation({ name: '서울특별시 마포구 합정동', lat: 37.5490, lon: 126.9140, type: '법정동', admin_parent: '서울특별시 마포구' });
    addLocation({ name: '서울특별시 마포구 망원1동', lat: 37.5600, lon: 126.9030, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['망원동'] });
    addLocation({ name: '서울특별시 마포구 연남동', lat: 37.5610, lon: 126.9260, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['연남동'] });
    addLocation({ name: '서울특별시 마포구 상암동', lat: 37.5770, lon: 126.8900, type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['상암동'] });

    // 양천구 및 하위 동
    addLocation({ name: '서울특별시 양천구', lat: 37.5173, lon: 126.8665, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['양천구'] });
    addLocation({ name: '서울특별시 양천구 목1동', lat: 37.5360, lon: 126.8780, type: '행정동', admin_parent: '서울특별시 양천구', legal_divisions: ['목동'] });
    addLocation({ name: '서울특별시 양천구 신월1동', lat: 37.5300, lon: 126.8370, type: '행정동', admin_parent: '서울특별시 양천구', legal_divisions: ['신월동'] });
    addLocation({ name: '서울특별시 양천구 신정1동', lat: 37.5180, lon: 126.8680, type: '행정동', admin_parent: '서울특별시 양천구', legal_divisions: ['신정동'] });

    // 강서구 및 하위 동
    addLocation({ name: '서울특별시 강서구', lat: 37.5509, lon: 126.8495, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['강서구'] });
    addLocation({ name: '서울특별시 강서구 염창동', lat: 37.5610, lon: 126.8770, type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['염창동'] });
    addLocation({ name: '서울특별시 강서구 등촌1동', lat: 37.5600, lon: 126.8570, type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['등촌동'] });
    addLocation({ name: '서울특별시 강서구 화곡1동', lat: 37.5450, lon: 126.8400, type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['화곡동'] });
    addLocation({ name: '서울특별시 강서구 가양1동', lat: 37.5660, lon: 126.8500, type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['가양동'] });
    addLocation({ name: '서울특별시 강서구 발산1동', lat: 37.5600, lon: 126.8200, type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['발산동'] });
    addLocation({ name: '서울특별시 강서구 공항동', lat: 37.5600, lon: 126.7940, type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['공항동'] });
    addLocation({ name: '서울특별시 강서구 방화1동', lat: 37.5700, lon: 126.8000, type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['방화동'] });

    // 구로구 및 하위 동
    addLocation({ name: '서울특별시 구로구', lat: 37.4954, lon: 126.8874, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['구로구'] });
    addLocation({ name: '서울특별시 구로구 신도림동', lat: 37.5060, lon: 126.8910, type: '행정동', admin_parent: '서울특별시 구로구', legal_divisions: ['신도림동'] });
    addLocation({ name: '서울특별시 구로구 구로1동', lat: 37.4960, lon: 126.8850, type: '행정동', admin_parent: '서울특별시 구로구', legal_divisions: ['구로동'] });
    addLocation({ name: '서울특별시 구로구 고척1동', lat: 37.5010, lon: 126.8650, type: '행정동', admin_parent: '서울특별시 구로구', legal_divisions: ['고척동'] });
    addLocation({ name: '서울특별시 구로구 개봉1동', lat: 37.4870, lon: 126.8580, type: '행정동', admin_parent: '서울특별시 구로구', legal_divisions: ['개봉동'] });
    addLocation({ name: '서울특별시 구로구 오류1동', lat: 37.4870, lon: 126.8370, type: '행정동', admin_parent: '서울특별시 구로구', legal_divisions: ['오류동'] });
    addLocation({ name: '서울특별시 구로구 가리봉동', lat: 37.4820, lon: 126.8820, type: '행정동', admin_parent: '서울특별시 구로구', legal_divisions: ['가리봉동'] });

    // 금천구 및 하위 동
    addLocation({ name: '서울특별시 금천구', lat: 37.4571, lon: 126.9009, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['금천구'] });
    addLocation({ name: '서울특별시 금천구 가산동', lat: 37.4770, lon: 126.8800, type: '행정동', admin_parent: '서울특별시 금천구', legal_divisions: ['가산동'] });
    addLocation({ name: '서울특별시 금천구 독산1동', lat: 37.4650, lon: 126.9000, type: '행정동', admin_parent: '서울특별시 금천구', legal_divisions: ['독산동'] });
    addLocation({ name: '서울특별시 금천구 시흥1동', lat: 37.4470, lon: 126.9140, type: '행정동', admin_parent: '서울특별시 금천구', legal_divisions: ['시흥동'] });

    // 영등포구 및 하위 동
    addLocation({ name: '서울특별시 영등포구', lat: 37.5262, lon: 126.9095, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['영등포구'] });
    addLocation({ name: '서울특별시 영등포구 여의동', lat: 37.5222, lon: 126.9242, type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['여의도동'], aliases: ['여의도'] });
    addLocation({ name: '서울특별시 영등포구 당산1동', lat: 37.5330, lon: 126.9000, type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['당산동1가', '당산동2가', '당산동3가', '당산동4가', '당산동5가', '당산동6가'] });
    addLocation({ name: '서울특별시 영등포구 영등포동', lat: 37.5180, lon: 126.9060, type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['영등포동'] });
    addLocation({ name: '서울특별시 영등포구 도림동', lat: 37.5080, lon: 126.8960, type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['도림동'] });
    addLocation({ name: '서울특별시 영등포구 신길1동', lat: 37.5080, lon: 126.9140, type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['신길동'] });
    addLocation({ name: '서울특별시 영등포구 대림1동', lat: 37.4900, lon: 126.9060, type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['대림동'] });
    addLocation({ name: '서울특별시 영등포구 양평1동', lat: 37.5400, lon: 126.8970, type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['양평동1가', '양평동2가', '양평동3가', '양평동4가', '양평동5가', '양평동6가', '당산동'] });

    // 동작구 및 하위 동
    addLocation({ name: '서울특별시 동작구', lat: 37.5124, lon: 126.9392, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['동작구'] });
    addLocation({ name: '서울특별시 동작구 노량진1동', lat: 37.5130, lon: 126.9400, type: '행정동', admin_parent: '서울특별시 동작구', legal_divisions: ['노량진동'] });
    addLocation({ name: '서울특별시 동작구 상도1동', lat: 37.5020, lon: 126.9440, type: '행정동', admin_parent: '서울특별시 동작구', legal_divisions: ['상도동'] });
    addLocation({ name: '서울특별시 동작구 흑석동', lat: 37.5080, lon: 126.9580, type: '행정동', admin_parent: '서울특별시 동작구', legal_divisions: ['흑석동'] });
    addLocation({ name: '서울특별시 동작구 사당1동', lat: 37.4840, lon: 126.9740, type: '행정동', admin_parent: '서울특별시 동작구', legal_divisions: ['사당동'] });
    addLocation({ name: '서울특별시 동작구 대방동', lat: 37.5000, lon: 126.9260, type: '행정동', admin_parent: '서울특별시 동작구', legal_divisions: ['대방동'] });
    addLocation({ name: '서울특별시 동작구 신대방1동', lat: 37.4910, lon: 126.9200, type: '행정동', admin_parent: '서울특별시 동작구', legal_divisions: ['신대방동'] });

    // 관악구 및 하위 동
    addLocation({ name: '서울특별시 관악구', lat: 37.4784, lon: 126.9517, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['관악구'] });
    addLocation({ name: '서울특별시 관악구 봉천동', lat: 37.4780, lon: 126.9530, type: '법정동', admin_parent: '서울특별시 관악구' });
    addLocation({ name: '서울특별시 관악구 신림동', lat: 37.4830, lon: 126.9300, type: '법정동', admin_parent: '서울특별시 관악구' });
    addLocation({ name: '서울특별시 관악구 남현동', lat: 37.4700, lon: 126.9800, type: '행정동', admin_parent: '서울특별시 관악구', legal_divisions: ['남현동'] });
    addLocation({ name: '서울특별시 관악구 대학동', lat: 37.4660, lon: 126.9400, type: '행정동', admin_parent: '서울특별시 관악구', legal_divisions: ['신림동'] });
    addLocation({ name: '서울특별시 관악구 조원동', lat: 37.4710, lon: 126.9060, type: '행정동', admin_parent: '서울특별시 관악구', legal_divisions: ['신림동'] });
    addLocation({ name: '서울특별시 관악구 삼성동', lat: 37.4650, lon: 126.9250, type: '행정동', admin_parent: '서울특별시 관악구', legal_divisions: ['신림동'] });
    addLocation({ name: '서울특별시 관악구 청룡동', lat: 37.4800, lon: 126.9540, type: '행정동', admin_parent: '서울특별시 관악구', legal_divisions: ['봉천동'] });
    addLocation({ name: '서울특별시 관악구 은천동', lat: 37.4860, lon: 126.9400, type: '행정동', admin_parent: '서울특별시 관악구', legal_divisions: ['봉천동'] });

    // 서초구 및 하위 동
    addLocation({ name: '서울특별시 서초구', lat: 37.4837, lon: 127.0324, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['서초구'] });
    addLocation({ name: '서울특별시 서초구 서초1동', lat: 37.4900, lon: 127.0170, type: '행정동', admin_parent: '서울특별시 서초구', legal_divisions: ['서초동'] });
    addLocation({ name: '서울특별시 서초구 잠원동', lat: 37.5200, lon: 127.0180, type: '행정동', admin_parent: '서울특별시 서초구', legal_divisions: ['잠원동'] });
    addLocation({ name: '서울특별시 서초구 반포1동', lat: 37.5020, lon: 127.0000, type: '행정동', admin_parent: '서울특별시 서초구', legal_divisions: ['반포동'] });
    addLocation({ name: '서울특별시 서초구 방배1동', lat: 37.4830, lon: 126.9850, type: '행정동', admin_parent: '서울특별시 서초구', legal_divisions: ['방배동'] });
    addLocation({ name: '서울특별시 서초구 양재1동', lat: 37.4600, lon: 127.0380, type: '행정동', admin_parent: '서울특별시 서초구', legal_divisions: ['양재동', '염곡동'] });
    addLocation({ name: '서울특별시 서초구 내곡동', lat: 37.4470, lon: 127.0700, type: '행정동', admin_parent: '서울특별시 서초구', legal_divisions: ['내곡동', '신원동', '원지동', '염곡동'] });
    addLocation({ name: '서울특별시 서초구 반포동', lat: 37.5050, lon: 127.0040, type: '별칭', admin_parent: '서울특별시 서초구', aliases: ['고속터미널'] });

    // 강남구 및 하위 동
    addLocation({ name: '서울특별시 강남구', lat: 37.5172, lon: 127.0473, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['강남구'] });
    addLocation({ name: '서울특별시 강남구 신사동', lat: 37.5200, lon: 127.0200, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['신사동'], aliases: ['가로수길'] });
    addLocation({ name: '서울특별시 강남구 논현1동', lat: 37.5130, lon: 127.0250, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['논현동'] });
    addLocation({ name: '서울특별시 강남구 압구정동', lat: 37.5270, lon: 127.0290, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['압구정동'] });
    addLocation({ name: '서울특별시 강남구 청담동', lat: 37.5220, lon: 127.0500, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['청담동'] });
    addLocation({ name: '서울특별시 강남구 삼성1동', lat: 37.5140, lon: 127.0560, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['삼성동'], aliases: ['코엑스'] });
    addLocation({ name: '서울특별시 강남구 대치1동', lat: 37.4990, lon: 127.0580, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['대치동'] });
    addLocation({ name: '서울특별시 강남구 역삼1동', lat: 37.5000, lon: 127.0360, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['역삼동'], aliases: ['강남', '강남역'] });
    addLocation({ name: '서울특별시 강남구 도곡1동', lat: 37.4900, lon: 127.0450, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['도곡동'] });
    addLocation({ name: '서울특별시 강남구 개포1동', lat: 37.4760, lon: 127.0540, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['개포동'] });
    addLocation({ name: '서울특별시 강남구 세곡동', lat: 37.4660, lon: 127.1000, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['세곡동', '자곡동', '율현동'] });
    addLocation({ name: '서울특별시 강남구 일원1동', lat: 37.4850, lon: 127.0800, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['일원동'] });
    addLocation({ name: '서울특별시 강남구 수서동', lat: 37.4870, lon: 127.1000, type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['수서동'] });

    // 송파구 및 하위 동
    addLocation({ name: '서울특별시 송파구', lat: 37.5145, lon: 127.1054, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['송파구'] });
    addLocation({ name: '서울특별시 송파구 잠실본동', lat: 37.5080, lon: 127.0850, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'], aliases: ['잠실'] });
    addLocation({ name: '서울특별시 송파구 잠실2동', lat: 37.5130, lon: 127.0860, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'] });
    addLocation({ name: '서울특별시 송파구 잠실3동', lat: 37.5100, lon: 127.0900, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'] });
    addLocation({ name: '서울특별시 송파구 잠실7동', lat: 37.5200, lon: 127.1000, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'] });
    addLocation({ name: '서울특별시 송파구 잠실4동', lat: 37.5160, lon: 127.0800, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'] });
    addLocation({ name: '서울특별시 송파구 잠실5동', lat: 37.5140, lon: 127.0820, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'] });
    addLocation({ name: '서울특별시 송파구 잠실6동', lat: 37.5130, lon: 127.0990, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'] });
    addLocation({ name: '서울특별시 송파구 신천동', lat: 37.5130, lon: 127.1000, type: '법정동', admin_parent: '서울특별시 송파구' });
    addLocation({ name: '서울특별시 송파구 방이1동', lat: 37.5150, lon: 127.1250, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['방이동'] });
    addLocation({ name: '서울특별시 송파구 오륜동', lat: 37.5140, lon: 127.1360, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['오륜동'] });
    addLocation({ name: '서울특별시 송파구 송파1동', lat: 37.5020, lon: 127.1080, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['송파동'] });
    addLocation({ name: '서울특별시 송파구 석촌동', lat: 37.5030, lon: 127.0990, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['석촌동'] });
    addLocation({ name: '서울특별시 송파구 삼전동', lat: 37.5070, lon: 127.0820, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['삼전동'] });
    addLocation({ name: '서울특별시 송파구 가락1동', lat: 37.4950, lon: 127.1120, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['가락동'] });
    addLocation({ name: '서울특별시 송파구 문정1동', lat: 37.4870, lon: 127.1160, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['문정동'] });
    addLocation({ name: '서울특별시 송파구 장지동', lat: 37.4780, lon: 127.1280, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['장지동', '복정동'] });
    addLocation({ name: '서울특별시 송파구 위례동', lat: 37.4850, lon: 127.1430, type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['장지동', '거여동'] });

    // 강동구 및 하위 동
    addLocation({ name: '서울특별시 강동구', lat: 37.5298, lon: 127.1269, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['강동구'] });
    addLocation({ name: '서울특별시 강동구 명일1동', lat: 37.5500, lon: 127.1400, type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['명일동'] });
    addLocation({ name: '서울특별시 강동구 고덕1동', lat: 37.5580, lon: 127.1480, type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['고덕동'] });
    addLocation({ name: '서울특별시 강동구 암사1동', lat: 37.5540, lon: 127.1280, type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['암사동'] });
    addLocation({ name: '서울특별시 강동구 천호1동', lat: 37.5380, lon: 127.1200, type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['천호동'] });
    addLocation({ name: '서울특별시 강동구 성내1동', lat: 37.5300, lon: 127.1200, type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['성내동'] });
    addLocation({ name: '서울특별시 강동구 둔촌1동', lat: 37.5200, lon: 127.1450, type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['둔촌동'] });
    addLocation({ name: '서울특별시 강동구 길동', lat: 37.5370, lon: 127.1370, type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['길동'] });
    addLocation({ name: '서울특별시 강동구 상일동', lat: 37.5500, lon: 127.1600, type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['상일동'] });
    addLocation({ name: '서울특별시 강동구 강일동', lat: 37.5670, lon: 127.1700, type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['강일동'] });




// 부산광역시 (광역자치단체)
addLocation('부산광역시', {lat: 35.1770194444444, lon: 129.076952777777, name: '부산광역시', type: '광역자치단체', admin_parent: '', aliases: ['부산']});

// 부산광역시 중구 (기초자치단체)
addLocation('중구', {lat: 35.1032166666666, lon: 129.034508333333, name: '부산광역시 중구', type: '기초자치단체', admin_parent: '부산광역시', aliases: ['중구']});
// 부산광역시 중구 행정동
addLocation('중앙동', {lat: 35.0981861111111, lon: 129.037588888888, name: '부산광역시 중구 중앙동', type: '행정동', admin_parent: '부산광역시 중구', legal_divisions: ['중앙동1가', '중앙동2가', '중앙동3가', '중앙동4가', '중앙동5가', '중앙동6가', '중앙동7가']});
addLocation('동광동', {lat: 35.1019333333333, lon: 129.036877777777, name: '부산광역시 중구 동광동', type: '행정동', admin_parent: '부산광역시 중구', legal_divisions: ['동광동1가', '동광동2가', '동광동3가', '동광동4가', '동광동5가']});
addLocation('대청동', {lat: 35.1011472222222, lon: 129.033333333333, name: '부산광역시 중구 대청동', type: '행정동', admin_parent: '부산광역시 중구', legal_divisions: ['대청동1가', '대청동2가', '대청동3가', '대청동4가']});
addLocation('보수동', {lat: 35.1007027777777, lon: 129.027622222222, name: '부산광역시 중구 보수동', type: '행정동', admin_parent: '부산광역시 중구', legal_divisions: ['보수동1가', '보수동2가', '보수동3가']});
addLocation('부평동', {lat: 35.0972972222222, lon: 129.028797222222, name: '부산광역시 중구 부평동', type: '행정동', admin_parent: '부산광역시 중구', legal_divisions: ['부평동1가', '부평동2가', '부평동3가', '부평동4가']});
addLocation('광복동', {lat: 35.0968583333333, lon: 129.032752777777, name: '부산광역시 중구 광복동', type: '행정동', admin_parent: '부산광역시 중구', legal_divisions: ['광복동1가', '광복동2가', '광복동3가']});
addLocation('남포동', {lat: 35.0943055555555, lon: 129.034086111111, name: '부산광역시 중구 남포동', type: '행정동', admin_parent: '부산광역시 중구', legal_divisions: ['남포동1가', '남포동2가', '남포동3가', '남포동4가', '남포동5가', '남포동6가'], aliases: ['남포동']});
addLocation('영주제1동', {lat: 35.1080472222222, lon: 129.037286111111, name: '부산광역시 중구 영주제1동', type: '행정동', admin_parent: '부산광역시 중구', legal_divisions: ['영주동']});
addLocation('영주제2동', {lat: 35.1085083333333, lon: 129.034033333333, name: '부산광역시 중구 영주제2동', type: '행정동', admin_parent: '부산광역시 중구', legal_divisions: ['영주동']});

// 부산광역시 서구 (기초자치단체)
addLocation('서구', {name: '부산광역시 서구', type: '기초자치단체', admin_parent: '부산광역시', aliases: ['서구']});
// 부산광역시 서구 행정동
addLocation('동대신제1동', {lat: 35.1065361111111, lon: 129.022508333333, name: '부산광역시 서구 동대신제1동', type: '행정동', admin_parent: '부산광역시 서구', legal_divisions: ['동대신동']});
addLocation('동대신제2동', {lat: 35.1098527777777, lon: 129.025430555555, name: '부산광역시 서구 동대신제2동', type: '행정동', admin_parent: '부산광역시 서구', legal_divisions: ['동대신동']});
addLocation('동대신제3동', {lat: 35.1113388888888, lon: 129.019508333333, name: '부산광역시 서구 동대신제3동', type: '행정동', admin_parent: '부산광역시 서구', legal_divisions: ['동대신동']});
addLocation('서대신제1동', {lat: 35.1080138888888, lon: 129.016675, name: '부산광역시 서구 서대신제1동', type: '행정동', admin_parent: '부산광역시 서구', legal_divisions: ['서대신동']});
addLocation('서대신제3동', {lat: 35.1103666666666, lon: 129.014188888888, name: '부산광역시 서구 서대신제3동', type: '행정동', admin_parent: '부산광역시 서구', legal_divisions: ['서대신동']});
addLocation('서대신제4동', {lat: 35.1160722222222, lon: 129.014833333333, name: '부산광역시 서구 서대신제4동', type: '행정동', admin_parent: '부산광역시 서구', legal_divisions: ['서대신동']});
addLocation('부민동', {lat: 35.1006861111111, lon: 129.020752777777, name: '부산광역시 서구 부민동', type: '행정동', admin_parent: '부산광역시 서구', legal_divisions: ['부민동']});
addLocation('아미동', {lat: 35.0970888888888, lon: 129.017686111111, name: '부산광역시 서구 아미동', type: '행정동', admin_parent: '부산광역시 서구', legal_divisions: ['아미동']});
addLocation('초장동', {lat: 35.0928777777777, lon: 129.022563888888, name: '부산광역시 서구 초장동', type: '행정동', admin_parent: '부산광역시 서구', legal_divisions: ['초장동']});
addLocation('충무동', {lat: 35.0949361111111, lon: 129.023897222222, name: '부산광역시 서구 충무동', type: '행정동', admin_parent: '부산광역시 서구', legal_divisions: ['충무동']});
addLocation('남부민제1동', {lat: 35.0896583333333, lon: 129.025563888888, name: '부산광역시 서구 남부민제1동', type: '행정동', admin_parent: '부산광역시 서구', legal_divisions: ['남부민동']});
addLocation('남부민제2동', {lat: 35.08155, lon: 129.021863888888, name: '부산광역시 서구 남부민제2동', type: '행정동', admin_parent: '부산광역시 서구', legal_divisions: ['남부민동']});
addLocation('암남동', {lat: 35.0769055555555, lon: 129.0236, name: '부산광역시 서구 암남동', type: '행정동', admin_parent: '부산광역시 서구', legal_divisions: ['암남동']});

// 부산광역시 동구 (기초자치단체)
addLocation('동구', {name: '부산광역시 동구', type: '기초자치단체', admin_parent: '부산광역시', aliases: ['동구']});
// 부산광역시 동구 행정동
addLocation('초량제1동', {lat: 35.1108777777777, lon: 129.039188888888, name: '부산광역시 동구 초량제1동', type: '행정동', admin_parent: '부산광역시 동구', legal_divisions: ['초량동']});
addLocation('초량제2동', {lat: 35.1134472222222, lon: 129.0408, name: '부산광역시 동구 초량제2동', type: '행정동', admin_parent: '부산광역시 동구', legal_divisions: ['초량동']});
addLocation('초량제3동', {lat: 35.1181861111111, lon: 129.042066666666, name: '부산광역시 동구 초량제3동', type: '행정동', admin_parent: '부산광역시 동구', legal_divisions: ['초량동']});
addLocation('초량제6동', {lat: 35.1229083333333, lon: 129.036744444444, name: '부산광역시 동구 초량제6동', type: '행정동', admin_parent: '부산광역시 동구', legal_divisions: ['초량동']});
addLocation('수정제1동', {lat: 35.122275, lon: 129.044533333333, name: '부산광역시 동구 수정제1동', type: '행정동', admin_parent: '부산광역시 동구', legal_divisions: ['수정동']});
addLocation('수정제2동', {lat: 35.1252527777777, lon: 129.047263888888, name: '부산광역시 동구 수정제2동', type: '행정동', admin_parent: '부산광역시 동구', legal_divisions: ['수정동']});
addLocation('수정제4동', {lat: 35.1239972222222, lon: 129.042963888888, name: '부산광역시 동구 수정제4동', type: '행정동', admin_parent: '부산광역시 동구', legal_divisions: ['수정동']});
addLocation('수정제5동', {lat: 35.1307333333333, lon: 129.044688888888, name: '부산광역시 동구 수정제5동', type: '행정동', admin_parent: '부산광역시 동구', legal_divisions: ['수정동']});
addLocation('좌천동', {lat: 35.1319861111111, lon: 129.052791666667, name: '부산광역시 동구 좌천동', type: '행정동', admin_parent: '부산광역시 동구', legal_divisions: ['좌천동']});
addLocation('범일제1동', {lat: 35.1362722222222, lon: 129.058308333333, name: '부산광역시 동구 범일제1동', type: '행정동', admin_parent: '부산광역시 동구', legal_divisions: ['범일동']});
addLocation('범일제2동', {lat: 35.1318722222222, lon: 129.061986111111, name: '부산광역시 동구 범일제2동', type: '행정동', admin_parent: '부산광역시 동구', legal_divisions: ['범일동']});
addLocation('범일제5동', {lat: 35.1273055555555, lon: 129.056019444444, name: '부산광역시 동구 범일제5동', type: '행정동', admin_parent: '부산광역시 동구', legal_divisions: ['범일동']});

// 부산광역시 영도구 (기초자치단체)
addLocation('영도구', {name: '부산광역시 영도구', type: '기초자치단체', admin_parent: '부산광역시', aliases: ['영도구']});
// 부산광역시 영도구 행정동
addLocation('남항동', {lat: 35.0867888888888, lon: 129.039852777777, name: '부산광역시 영도구 남항동', type: '행정동', admin_parent: '부산광역시 영도구', legal_divisions: ['남항동']});
addLocation('영선제1동', {lat: 35.0871611111111, lon: 129.047033333333, name: '부산광역시 영도구 영선제1동', type: '행정동', admin_parent: '부산광역시 영도구', legal_divisions: ['영선동']});
addLocation('영선제2동', {lat: 35.08385, lon: 129.043641666666, name: '부산광역시 영도구 영선제2동', type: '행정동', admin_parent: '부산광역시 영도구', legal_divisions: ['영선동']});
addLocation('신선동', {lat: 35.0802444444444, lon: 129.047455555555, name: '부산광역시 영도구 신선동', type: '행정동', admin_parent: '부산광역시 영도구', legal_divisions: ['신선동']});
addLocation('봉래제1동', {lat: 35.0903916666666, lon: 129.046622222222, name: '부산광역시 영도구 봉래제1동', type: '행정동', admin_parent: '부산광역시 영도구', legal_divisions: ['봉래동']});
addLocation('봉래제2동', {lat: 35.0911083333333, lon: 129.048397222222, name: '부산광역시 영도구 봉래제2동', type: '행정동', admin_parent: '부산광역시 영도구', legal_divisions: ['봉래동']});
addLocation('청학제1동', {lat: 35.0938333333333, lon: 129.060686111111, name: '부산광역시 영도구 청학제1동', type: '행정동', admin_parent: '부산광역시 영도구', legal_divisions: ['청학동']});
addLocation('청학제2동', {lat: 35.088825, lon: 129.068030555555, name: '부산광역시 영도구 청학제2동', type: '행정동', admin_parent: '부산광역시 영도구', legal_divisions: ['청학동']});
addLocation('동삼제1동', {lat: 35.0717944444444, lon: 129.070708333333, name: '부산광역시 영도구 동삼제1동', type: '행정동', admin_parent: '부산광역시 영도구', legal_divisions: ['동삼동']});
addLocation('동삼제2동', {lat: 35.0647416666666, lon: 129.082922222222, name: '부산광역시 영도구 동삼제2동', type: '행정동', admin_parent: '부산광역시 영도구', legal_divisions: ['동삼동']});
addLocation('동삼제3동', {lat: 35.0815805555555, lon: 129.070922222222, name: '부산광역시 영도구 동삼제3동', type: '행정동', admin_parent: '부산광역시 영도구', legal_divisions: ['동삼동']});

// 부산광역시 부산진구 (기초자치단체)
addLocation('부산진구', {name: '부산광역시 부산진구', type: '기초자치단체', admin_parent: '부산광역시', aliases: ['부산진구']});
// 부산광역시 부산진구 행정동
addLocation('부전제1동', {lat: 35.1572583333333, lon: 129.060922222222, name: '부산광역시 부산진구 부전제1동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['부전동']});
addLocation('부전제2동', {lat: 35.1495222222222, lon: 129.059075, name: '부산광역시 부산진구 부전제2동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['부전동']});
addLocation('연지동', {lat: 35.1697138888888, lon: 129.055008333333, name: '부산광역시 부산진구 연지동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['연지동']});
addLocation('초읍동', {lat: 35.175625, lon: 129.049833333333, name: '부산광역시 부산진구 초읍동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['초읍동']});
addLocation('양정제1동', {lat: 35.1713972222222, lon: 129.066655555555, name: '부산광역시 부산진구 양정제1동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['양정동']});
addLocation('양정제2동', {lat: 35.1697805555555, lon: 129.077988888888, name: '부산광역시 부산진구 양정제2동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['양정동']});
addLocation('전포제1동', {lat: 35.1512694444444, lon: 129.069622222222, name: '부산광역시 부산진구 전포제1동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['전포동']});
addLocation('전포제2동', {lat: 35.1586305555555, lon: 129.068444444444, name: '부산광역시 부산진구 전포제2동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['전포동']});
addLocation('부암제1동', {lat: 35.1604611111111, lon: 129.051777777777, name: '부산광역시 부산진구 부암제1동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['부암동']});
addLocation('부암제3동', {lat: 35.1659222222222, lon: 129.042055555555, name: '부산광역시 부산진구 부암제3동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['부암동']});
addLocation('당감제1동', {lat: 35.1597, lon: 129.042366666666, name: '부산광역시 부산진구 당감제1동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['당감동']});
addLocation('당감제2동', {lat: 35.1548888888888, lon: 129.050277777777, name: '부산광역시 부산진구 당감제2동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['당감동']});
addLocation('당감제4동', {lat: 35.1649138888888, lon: 129.038797222222, name: '부산광역시 부산진구 당감제4동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['당감동']});
addLocation('가야제1동', {lat: 35.1519111111111, lon: 129.044052777777, name: '부산광역시 부산진구 가야제1동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['가야동']});
addLocation('가야제2동', {lat: 35.1466805555555, lon: 129.031288888888, name: '부산광역시 부산진구 가야제2동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['가야동']});
addLocation('개금제1동', {lat: 35.1495666666666, lon: 129.024175, name: '부산광역시 부산진구 개금제1동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['개금동']});
addLocation('개금제2동', {lat: 35.1417055555555, lon: 129.021688888888, name: '부산광역시 부산진구 개금제2동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['개금동']});
addLocation('개금제3동', {lat: 35.1526861111111, lon: 129.024222222222, name: '부산광역시 부산진구 개금제3동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['개금동']});
addLocation('범천제1동', {lat: 35.14385, lon: 129.0633, name: '부산광역시 부산진구 범천제1동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['범천동']});
addLocation('범천제2동', {lat: 35.1432777777777, lon: 129.058397222222, name: '부산광역시 부산진구 범천제2동', type: '행정동', admin_parent: '부산광역시 부산진구', legal_divisions: ['범천동']});

// 부산광역시 동래구 (기초자치단체)
addLocation('동래구', {name: '부산광역시 동래구', type: '기초자치단체', admin_parent: '부산광역시', aliases: ['동래구']});
// 부산광역시 동래구 행정동
addLocation('수민동', {lat: 35.192975, lon: 129.093388888888, name: '부산광역시 동래구 수민동', type: '행정동', admin_parent: '부산광역시 동래구', legal_divisions: ['수민동']});
addLocation('복산동', {lat: 35.2027083333333, lon: 129.088375, name: '부산광역시 동래구 복산동', type: '행정동', admin_parent: '부산광역시 동래구', legal_divisions: ['복산동']});
addLocation('명륜동', {lat: 35.2124914, lon: 129.081561, name: '부산광역시 동래구 명륜동', type: '행정동', admin_parent: '부산광역시 동래구', legal_divisions: ['명륜동']});
addLocation('온천제1동', {lat: 35.2169666666666, lon: 129.082386111111, name: '부산광역시 동래구 온천제1동', type: '행정동', admin_parent: '부산광역시 동래구', legal_divisions: ['온천동']});
addLocation('온천제2동', {lat: 35.2048833333333, lon: 129.075252777777, name: '부산광역시 동래구 온천제2동', type: '행정동', admin_parent: '부산광역시 동래구', legal_divisions: ['온천동']});
addLocation('온천제3동', {lat: 35.2018666666666, lon: 129.068552777777, name: '부산광역시 동래구 온천제3동', type: '행정동', admin_parent: '부산광역시 동래구', legal_divisions: ['온천동']});
addLocation('사직제1동', {lat: 35.1959333333333, lon: 129.064344444444, name: '부산광역시 동래구 사직제1동', type: '행정동', admin_parent: '부산광역시 동래구', legal_divisions: ['사직동']});
addLocation('사직제2동', {lat: 35.1971749999999, lon: 129.059166666666, name: '부산광역시 동래구 사직제2동', type: '행정동', admin_parent: '부산광역시 동래구', legal_divisions: ['사직동']});
addLocation('사직제3동', {lat: 35.1963888888888, lon: 129.071722222222, name: '부산광역시 동래구 사직제3동', type: '행정동', admin_parent: '부산광역시 동래구', legal_divisions: ['사직동']});
addLocation('안락제1동', {lat: 35.1940472222222, lon: 129.100911111111, name: '부산광역시 동래구 안락제1동', type: '행정동', admin_parent: '부산광역시 동래구', legal_divisions: ['안락동']});
addLocation('안락제2동', {lat: 35.1946444444444, lon: 129.112311111111, name: '부산광역시 동래구 안락제2동', type: '행정동', admin_parent: '부산광역시 동래구', legal_divisions: ['안락동']});
addLocation('명장제1동', {lat: 35.2015805555555, lon: 129.106499999999, name: '부산광역시 동래구 명장제1동', type: '행정동', admin_parent: '부산광역시 동래구', legal_divisions: ['명장동']});
addLocation('명장제2동', {lat: 35.2048666666666, lon: 129.104655555555, name: '부산광역시 동래구 명장제2동', type: '행정동', admin_parent: '부산광역시 동래구', legal_divisions: ['명장동']});

// 부산광역시 남구 (기초자치단체)
addLocation('남구', {name: '부산광역시 남구', type: '기초자치단체', admin_parent: '부산광역시', aliases: ['남구']});
// 부산광역시 남구 행정동
addLocation('대연제1동', {lat: 35.1314638888888, lon: 129.095719444444, name: '부산광역시 남구 대연제1동', type: '행정동', admin_parent: '부산광역시 남구', legal_divisions: ['대연동']});
addLocation('대연제3동', {lat: 35.1316361111111, lon: 129.102577777777, name: '부산광역시 남구 대연제3동', type: '행정동', admin_parent: '부산광역시 남구', legal_divisions: ['대연동']});
addLocation('대연제4동', {lat: 35.1267111111111, lon: 129.093619444444, name: '부산광역시 남구 대연제4동', type: '행정동', admin_parent: '부산광역시 남구', legal_divisions: ['대연동']});
addLocation('대연제5동', {lat: 35.1353694444444, lon: 129.092488888888, name: '부산광역시 남구 대연제5동', type: '행정동', admin_parent: '부산광역시 남구', legal_divisions: ['대연동']});
addLocation('대연제6동', {lat: 35.1318666666666, lon: 129.085841666666, name: '부산광역시 남구 대연제6동', type: '행정동', admin_parent: '부산광역시 남구', legal_divisions: ['대연동']});
addLocation('용호제1동', {lat: 35.1177138888888, lon: 129.111297222222, name: '부산광역시 남구 용호제1동', type: '행정동', admin_parent: '부산광역시 남구', legal_divisions: ['용호동']});
addLocation('용호제2동', {lat: 35.11175, lon: 129.115686111111, name: '부산광역시 남구 용호제2동', type: '행정동', admin_parent: '부산광역시 남구', legal_divisions: ['용호동']});
addLocation('용호제3동', {lat: 35.1179222222222, lon: 129.115063888888, name: '부산광역시 남구 용호제3동', type: '행정동', admin_parent: '부산광역시 남구', legal_divisions: ['용호동']});
addLocation('용호제4동', {lat: 35.1101444444444, lon: 129.112663888888, name: '부산광역시 남구 용호제4동', type: '행정동', admin_parent: '부산광역시 남구', legal_divisions: ['용호동']});
addLocation('용당동', {lat: 35.1144111111111, lon: 129.097455555555, name: '부산광역시 남구 용당동', type: '행정동', admin_parent: '부산광역시 남구', legal_divisions: ['용당동']});
addLocation('감만제1동', {lat: 35.1137888888888, lon: 129.082888888888, name: '부산광역시 남구 감만제1동', type: '행정동', admin_parent: '부산광역시 남구', legal_divisions: ['감만동']});
addLocation('감만제2동', {lat: 35.1194583333333, lon: 129.086777777777, name: '부산광역시 남구 감만제2동', type: '행정동', admin_parent: '부산광역시 남구', legal_divisions: ['감만동']});
addLocation('우암동', {lat: 35.12499999, lon: 129.0758507, name: '부산광역시 남구 우암동', type: '행정동', admin_parent: '부산광역시 남구', legal_divisions: ['우암동']});
addLocation('문현제1동', {lat: 35.1393944444444, lon: 129.073577777777, name: '부산광역시 남구 문현제1동', type: '행정동', admin_parent: '부산광역시 남구', legal_divisions: ['문현동']});
addLocation('문현제2동', {lat: 35.1422222222222, lon: 129.070997222222, name: '부산광역시 남구 문현제2동', type: '행정동', admin_parent: '부산광역시 남구', legal_divisions: ['문현동']});
addLocation('문현제3동', {lat: 35.1351222222222, lon: 129.073919444444, name: '부산광역시 남구 문현제3동', type: '행정동', admin_parent: '부산광역시 남구', legal_divisions: ['문현동']});
addLocation('문현제4동', {lat: 35.1330305555555, lon: 129.0712, name: '부산광역시 남구 문현제4동', type: '행정동', admin_parent: '부산광역시 남구', legal_divisions: ['문현동']});

// 부산광역시 북구 (기초자치단체)
addLocation('북구', {name: '부산광역시 북구', type: '기초자치단체', admin_parent: '부산광역시', aliases: ['북구']});
// 부산광역시 북구 행정동
addLocation('구포제1동', {lat: 35.2033694444444, lon: 129.003411111111, name: '부산광역시 북구 구포제1동', type: '행정동', admin_parent: '부산광역시 북구', legal_divisions: ['구포동']});
addLocation('구포제2동', {lat: 35.1996361111111, lon: 129.000244444444, name: '부산광역시 북구 구포제2동', type: '행정동', admin_parent: '부산광역시 북구', legal_divisions: ['구포동']});
addLocation('구포제3동', {lat: 35.1917583333333, lon: 129.011044444444, name: '부산광역시 북구 구포제3동', type: '행정동', admin_parent: '부산광역시 북구', legal_divisions: ['구포동']});
addLocation('금곡동', {lat: 35.2470055555555, lon: 129.015088888888, name: '부산광역시 북구 금곡동', type: '행정동', admin_parent: '부산광역시 북구', legal_divisions: ['금곡동']});
addLocation('화명제1동', {lat: 35.2216944444444, lon: 129.012466666666, name: '부산광역시 북구 화명제1동', type: '행정동', admin_parent: '부산광역시 북구', legal_divisions: ['화명동']});
addLocation('화명제2동', {lat: 35.240525, lon: 129.022022222222, name: '부산광역시 북구 화명제2동', type: '행정동', admin_parent: '부산광역시 북구', legal_divisions: ['화명동']});
addLocation('화명제3동', {lat: 35.2287722222222, lon: 129.012333333333, name: '부산광역시 북구 화명제3동', type: '행정동', admin_parent: '부산광역시 북구', legal_divisions: ['화명동']});
addLocation('덕천제1동', {lat: 35.2093888888888, lon: 129.019019444444, name: '부산광역시 북구 덕천제1동', type: '행정동', admin_parent: '부산광역시 북구', legal_divisions: ['덕천동']});
addLocation('덕천제2동', {lat: 35.2092666666666, lon: 129.010244444444, name: '부산광역시 북구 덕천제2동', type: '행정동', admin_parent: '부산광역시 북구', legal_divisions: ['덕천동']});
addLocation('덕천제3동', {lat: 35.2068194444444, lon: 129.019697222222, name: '부산광역시 북구 덕천제3동', type: '행정동', admin_parent: '부산광역시 북구', legal_divisions: ['덕천동']});
addLocation('만덕제1동', {lat: 35.2103666666666, lon: 129.038519444444, name: '부산광역시 북구 만덕제1동', type: '행정동', admin_parent: '부산광역시 북구', legal_divisions: ['만덕동']});
addLocation('만덕제2동', {lat: 35.2071194444444, lon: 129.039466666666, name: '부산광역시 북구 만덕제2동', type: '행정동', admin_parent: '부산광역시 북구', legal_divisions: ['만덕동']});
addLocation('만덕제3동', {lat: 35.2083083333333, lon: 129.031397222222, name: '부산광역시 북구 만덕제3동', type: '행정동', admin_parent: '부산광역시 북구', legal_divisions: ['만덕동']});

// 부산광역시 해운대구 (기초자치단체)
addLocation('해운대구', {name: '부산광역시 해운대구', type: '기초자치단체', admin_parent: '부산광역시', aliases: ['해운대구', '해운대']});
// 부산광역시 해운대구 행정동
addLocation('우제1동', {lat: 35.1598111111111, lon: 129.160286111111, name: '부산광역시 해운대구 우제1동', type: '행정동', admin_parent: '부산광역시 해운대구', legal_divisions: ['우동']});
addLocation('우제2동', {lat: 35.1681555555555, lon: 129.142211111111, name: '부산광역시 해운대구 우제2동', type: '행정동', admin_parent: '부산광역시 해운대구', legal_divisions: ['우동']});
addLocation('우제3동', {lat: 35.1592915, lon: 129.1424022, name: '부산광역시 해운대구 우제3동', type: '행정동', admin_parent: '부산광역시 해운대구', legal_divisions: ['우동']});
addLocation('중제1동', {lat: 35.1594583333333, lon: 129.166477777777, name: '부산광역시 해운대구 중제1동', type: '행정동', admin_parent: '부산광역시 해운대구', legal_divisions: ['중동']});
addLocation('중제2동', {lat: 35.1587972222222, lon: 129.182108333333, name: '부산광역시 해운대구 중제2동', type: '행정동', admin_parent: '부산광역시 해운대구', legal_divisions: ['중동']});
addLocation('좌제1동', {lat: 35.1678222222222, lon: 129.176552777777, name: '부산광역시 해운대구 좌제1동', type: '행정동', admin_parent: '부산광역시 해운대구', legal_divisions: ['좌동']});
addLocation('좌제2동', {lat: 35.1660611111111, lon: 129.184919444444, name: '부산광역시 해운대구 좌제2동', type: '행정동', admin_parent: '부산광역시 해운대구', legal_divisions: ['좌동']});
addLocation('좌제3동', {lat: 35.1692638888888, lon: 129.168986111111, name: '부산광역시 해운대구 좌제3동', type: '행정동', admin_parent: '부산광역시 해운대구', legal_divisions: ['좌동']});
addLocation('좌제4동', {lat: 35.1748666666666, lon: 129.178477777777, name: '부산광역시 해운대구 좌제4동', type: '행정동', admin_parent: '부산광역시 해운대구', legal_divisions: ['좌동']});
addLocation('송정동', {lat: 35.1805611111111, lon: 129.205897222222, name: '부산광역시 해운대구 송정동', type: '행정동', admin_parent: '부산광역시 해운대구', legal_divisions: ['송정동']});
addLocation('반여제1동', {lat: 35.1980555555555, lon: 129.121188888888, name: '부산광역시 해운대구 반여제1동', type: '행정동', admin_parent: '부산광역시 해운대구', legal_divisions: ['반여동']});
addLocation('반여제2동', {lat: 35.1928305555555, lon: 129.132352777777, name: '부산광역시 해운대구 반여제2동', type: '행정동', admin_parent: '부산광역시 해운대구', legal_divisions: ['반여동']});
addLocation('반여제3동', {lat: 35.1980055555555, lon: 129.135699999999, name: '부산광역시 해운대구 반여제3동', type: '행정동', admin_parent: '부산광역시 해운대구', legal_divisions: ['반여동']});
addLocation('반여제4동', {lat: 35.2061027777777, lon: 129.119344444444, name: '부산광역시 해운대구 반여제4동', type: '행정동', admin_parent: '부산광역시 해운대구', legal_divisions: ['반여동']});
addLocation('반송제1동', {lat: 35.2220527777777, lon: 129.150008333333, name: '부산광역시 해운대구 반송제1동', type: '행정동', admin_parent: '부산광역시 해운대구', legal_divisions: ['반송동']});
addLocation('반송제2동', {lat: 35.2257638888888, lon: 129.162697222222, name: '부산광역시 해운대구 반송제2동', type: '행정동', admin_parent: '부산광역시 해운대구', legal_divisions: ['반송동']});
addLocation('재송제1동', {lat: 35.1808638888888, lon: 129.125644444444, name: '부산광역시 해운대구 재송제1동', type: '행정동', admin_parent: '부산광역시 해운대구', legal_divisions: ['재송동']});
addLocation('재송제2동', {lat: 35.18655, lon: 129.127719444444, name: '부산광역시 해운대구 재송제2동', type: '행정동', admin_parent: '부산광역시 해운대구', legal_divisions: ['재송동']});

// 부산광역시 사하구 (기초자치단체)
addLocation('사하구', {name: '부산광역시 사하구', type: '기초자치단체', admin_parent: '부산광역시', aliases: ['사하구']});
// 부산광역시 사하구 행정동
addLocation('괴정제1동', {lat: 35.0965027777777, lon: 128.991622222222, name: '부산광역시 사하구 괴정제1동', type: '행정동', admin_parent: '부산광역시 사하구', legal_divisions: ['괴정동']});
addLocation('괴정제2동', {lat: 35.1004305555555, lon: 129.006275, name: '부산광역시 사하구 괴정제2동', type: '행정동', admin_parent: '부산광역시 사하구', legal_divisions: ['괴정동']});
addLocation('괴정제3동', {lat: 35.0972111111111, lon: 129.000422222222, name: '부산광역시 사하구 괴정제3동', type: '행정동', admin_parent: '부산광역시 사하구', legal_divisions: ['괴정동']});
addLocation('괴정제4동', {lat: 35.0960166666666, lon: 128.9854, name: '부산광역시 사하구 괴정제4동', type: '행정동', admin_parent: '부산광역시 사하구', legal_divisions: ['괴정동']});
addLocation('당리동', {lat: 35.0998444444444, lon: 128.978930555555, name: '부산광역시 사하구 당리동', type: '행정동', admin_parent: '부산광역시 사하구', legal_divisions: ['당리동']});
addLocation('하단제1동', {lat: 35.1008333333333, lon: 128.966533333333, name: '부산광역시 사하구 하단제1동', type: '행정동', admin_parent: '부산광역시 사하구', legal_divisions: ['하단동']});
addLocation('하단제2동', {lat: 35.1114333333333, lon: 128.962686111111, name: '부산광역시 사하구 하단제2동', type: '행정동', admin_parent: '부산광역시 사하구', legal_divisions: ['하단동']});
addLocation('신평제1동', {lat: 35.0869138888888, lon: 128.976575, name: '부산광역시 사하구 신평제1동', type: '행정동', admin_parent: '부산광역시 사하구', legal_divisions: ['신평동']});
addLocation('신평제2동', {lat: 35.0915333333333, lon: 128.961633333333, name: '부산광역시 사하구 신평제2동', type: '행정동', admin_parent: '부산광역시 사하구', legal_divisions: ['신평동']});
addLocation('장림제1동', {lat: 35.0798194444444, lon: 128.969141666666, name: '부산광역시 사하구 장림제1동', type: '행정동', admin_parent: '부산광역시 사하구', legal_divisions: ['장림동']});
addLocation('장림제2동', {lat: 35.0747277777777, lon: 128.974844444444, name: '부산광역시 사하구 장림제2동', type: '행정동', admin_parent: '부산광역시 사하구', legal_divisions: ['장림동']});
addLocation('다대제1동', {lat: 35.0561027777777, lon: 128.973577777777, name: '부산광역시 사하구 다대제1동', type: '행정동', admin_parent: '부산광역시 사하구', legal_divisions: ['다대동']});
addLocation('다대제2동', {lat: 35.0603222222222, lon: 128.984433333333, name: '부산광역시 사하구 다대제2동', type: '행정동', admin_parent: '부산광역시 사하구', legal_divisions: ['다대동']});
addLocation('구평동', {lat: 35.0788194444444, lon: 128.990041666666, name: '부산광역시 사하구 구평동', type: '행정동', admin_parent: '부산광역시 사하구', legal_divisions: ['구평동']});
addLocation('감천제1동', {lat: 35.0849055555555, lon: 129.006911111111, name: '부산광역시 사하구 감천제1동', type: '행정동', admin_parent: '부산광역시 사하구', legal_divisions: ['감천동']});
addLocation('감천제2동', {lat: 35.091525, lon: 129.0116, name: '부산광역시 사하구 감천제2동', type: '행정동', admin_parent: '부산광역시 사하구', legal_divisions: ['감천동']});

// 부산광역시 금정구 (기초자치단체)
addLocation('금정구', {name: '부산광역시 금정구', type: '기초자치단체', admin_parent: '부산광역시', aliases: ['금정구']});
// 부산광역시 금정구 행정동
addLocation('서제1동', {lat: 35.2152611111111, lon: 129.101397222222, name: '부산광역시 금정구 서제1동', type: '행정동', admin_parent: '부산광역시 금정구', legal_divisions: ['서동']});
addLocation('서제2동', {lat: 35.2097805555555, lon: 129.106933333333, name: '부산광역시 금정구 서제2동', type: '행정동', admin_parent: '부산광역시 금정구', legal_divisions: ['서동']});
addLocation('서제3동', {lat: 35.212375, lon: 129.109730555555, name: '부산광역시 금정구 서제3동', type: '행정동', admin_parent: '부산광역시 금정구', legal_divisions: ['서동']});
addLocation('금사회동동', {lat: 35.2172361111111, lon: 129.113375, name: '부산광역시 금정구 금사회동동', type: '행정동', admin_parent: '부산광역시 금정구', legal_divisions: ['회동동', '금사동']});
addLocation('부곡제1동', {lat: 35.22135, lon: 129.0944, name: '부산광역시 금정구 부곡제1동', type: '행정동', admin_parent: '부산광역시 금정구', legal_divisions: ['부곡동']});
addLocation('부곡제2동', {lat: 35.2267277777777, lon: 129.095, name: '부산광역시 금정구 부곡제2동', type: '행정동', admin_parent: '부산광역시 금정구', legal_divisions: ['부곡동']});
addLocation('부곡제3동', {lat: 35.2374055555555, lon: 129.096133333333, name: '부산광역시 금정구 부곡제3동', type: '행정동', admin_parent: '부산광역시 금정구', legal_divisions: ['부곡동']});
addLocation('부곡제4동', {lat: 35.2168138888888, lon: 129.090875, name: '부산광역시 금정구 부곡제4동', type: '행정동', admin_parent: '부산광역시 금정구', legal_divisions: ['부곡동']});
addLocation('장전제1동', {lat: 35.2346666666666, lon: 129.087211111111, name: '부산광역시 금정구 장전제1동', type: '행정동', admin_parent: '부산광역시 금정구', legal_divisions: ['장전동']});
addLocation('장전제2동', {lat: 35.2225305555555, lon: 129.084377777777, name: '부산광역시 금정구 장전제2동', type: '행정동', admin_parent: '부산광역시 금정구', legal_divisions: ['장전동']});
addLocation('선두구동', {lat: 35.2952083333333, lon: 129.115597222222, name: '부산광역시 금정구 선두구동', type: '행정동', admin_parent: '부산광역시 금정구', legal_divisions: ['선동', '두구동']});
addLocation('청룡노포동', {lat: 35.27205, lon: 129.092055555555, name: '부산광역시 금정구 청룡노포동', type: '행정동', admin_parent: '부산광역시 금정구', legal_divisions: ['청룡동', '노포동']});
addLocation('남산동', {lat: 35.2685555555555, lon: 129.094622222222, name: '부산광역시 금정구 남산동', type: '행정동', admin_parent: '부산광역시 금정구', legal_divisions: ['남산동']});
addLocation('구서제1동', {lat: 35.2419916666666, lon: 129.089230555555, name: '부산광역시 금정구 구서제1동', type: '행정동', admin_parent: '부산광역시 금정구', legal_divisions: ['구서동']});
addLocation('구서제2동', {lat: 35.2520833333333, lon: 129.092888888888, name: '부산광역시 금정구 구서제2동', type: '행정동', admin_parent: '부산광역시 금정구', legal_divisions: ['구서동']});
addLocation('금성동', {lat: 35.2472527777777, lon: 129.058341666666, name: '부산광역시 금정구 금성동', type: '행정동', admin_parent: '부산광역시 금정구', legal_divisions: ['금성동']});

// 부산광역시 강서구 (기초자치단체)
addLocation('강서구', {name: '부산광역시 강서구', type: '기초자치단체', admin_parent: '부산광역시', aliases: ['강서구']});
// 부산광역시 강서구 행정동
addLocation('대저1동', {lat: 35.2113944444444, lon: 128.982855555555, name: '부산광역시 강서구 대저1동', type: '행정동', admin_parent: '부산광역시 강서구', legal_divisions: ['대저동']});
addLocation('대저2동', {lat: 35.1753944444444, lon: 128.9587, name: '부산광역시 강서구 대저2동', type: '행정동', admin_parent: '부산광역시 강서구', legal_divisions: ['대저동']});
addLocation('강동동', {lat: 35.2114638888888, lon: 128.937508333333, name: '부산광역시 강서구 강동동', type: '행정동', admin_parent: '부산광역시 강서구', legal_divisions: ['강동동']});
addLocation('명지1동', {lat: 35.108091, lon: 128.926502, name: '부산광역시 강서구 명지1동', type: '행정동', admin_parent: '부산광역시 강서구', legal_divisions: ['명지동']});
addLocation('명지2동', {lat: 35.084587, lon: 128.899758, name: '부산광역시 강서구 명지2동', type: '행정동', admin_parent: '부산광역시 강서구', legal_divisions: ['명지동']});
addLocation('가락동', {lat: 35.1933166666666, lon: 128.904075, name: '부산광역시 강서구 가락동', type: '행정동', admin_parent: '부산광역시 강서구', legal_divisions: ['가락동']});
addLocation('녹산동', {lat: 35.1234638888888, lon: 128.860808333333, name: '부산광역시 강서구 녹산동', type: '행정동', admin_parent: '부산광역시 강서구', legal_divisions: ['녹산동']});
addLocation('가덕도동', {lat: 35.0526166666667, lon: 128.814033333333, name: '부산광역시 강서구 가덕도동', type: '행정동', admin_parent: '부산광역시 강서구', legal_divisions: ['대항동', '동선동', '성북동', '눌차동', '천성동']});
addLocation('신호동', {lat: 35.085443537101, lon: 128.879107082157, name: '부산광역시 강서구 신호동', type: '행정동', admin_parent: '부산광역시 강서구', legal_divisions: ['신호동']});

// 부산광역시 연제구 (기초자치단체)
addLocation('연제구', {name: '부산광역시 연제구', type: '기초자치단체', admin_parent: '부산광역시', aliases: ['연제구']});
// 부산광역시 연제구 행정동
addLocation('거제제1동', {lat: 35.1917194444444, lon: 129.083022222222, name: '부산광역시 연제구 거제제1동', type: '행정동', admin_parent: '부산광역시 연제구', legal_divisions: ['거제동']});
addLocation('거제제2동', {lat: 35.1845722222222, lon: 129.072541666666, name: '부산광역시 연제구 거제제2동', type: '행정동', admin_parent: '부산광역시 연제구', legal_divisions: ['거제동']});
addLocation('거제제3동', {lat: 35.1810333333333, lon: 129.075308333333, name: '부산광역시 연제구 거제제3동', type: '행정동', admin_parent: '부산광역시 연제구', legal_divisions: ['거제동']});
addLocation('거제제4동', {lat: 35.1761305555555, lon: 129.070022222222, name: '부산광역시 연제구 거제제4동', type: '행정동', admin_parent: '부산광역시 연제구', legal_divisions: ['거제동']});
addLocation('연산제1동', {lat: 35.1858777777777, lon: 129.093844444444, name: '부산광역시 연제구 연산제1동', type: '행정동', admin_parent: '부산광역시 연제구', legal_divisions: ['연산동']});
addLocation('연산제2동', {lat: 35.1768333333333, lon: 129.081575, name: '부산광역시 연제구 연산제2동', type: '행정동', admin_parent: '부산광역시 연제구', legal_divisions: ['연산동']});
addLocation('연산제3동', {lat: 35.1702694444444, lon: 129.096511111111, name: '부산광역시 연제구 연산제3동', type: '행정동', admin_parent: '부산광역시 연제구', legal_divisions: ['연산동']});
addLocation('연산제4동', {lat: 35.1832166666666, lon: 129.087155555555, name: '부산광역시 연제구 연산제4동', type: '행정동', admin_parent: '부산광역시 연제구', legal_divisions: ['연산동']});
addLocation('연산제5동', {lat: 35.1814194444444, lon: 129.078355555555, name: '부산광역시 연제구 연산제5동', type: '행정동', admin_parent: '부산광역시 연제구', legal_divisions: ['연산동']});
addLocation('연산제6동', {lat: 35.1757722222222, lon: 129.087941666666, name: '부산광역시 연제구 연산제6동', type: '행정동', admin_parent: '부산광역시 연제구', legal_divisions: ['연산동']});
addLocation('연산제8동', {lat: 35.1840333333333, lon: 129.103333333333, name: '부산광역시 연제구 연산제8동', type: '행정동', admin_parent: '부산광역시 연제구', legal_divisions: ['연산동']});
addLocation('연산제9동', {lat: 35.1855472222222, lon: 129.107197222222, name: '부산광역시 연제구 연산제9동', type: '행정동', admin_parent: '부산광역시 연제구', legal_divisions: ['연산동']});

// 부산광역시 수영구 (기초자치단체)
addLocation('수영구', {name: '부산광역시 수영구', type: '기초자치단체', admin_parent: '부산광역시', aliases: ['수영구', '광안리']});
// 부산광역시 수영구 행정동
addLocation('남천제1동', {lat: 35.139575, lon: 129.112597222222, name: '부산광역시 수영구 남천제1동', type: '행정동', admin_parent: '부산광역시 수영구', legal_divisions: ['남천동']});
addLocation('남천제2동', {lat: 35.1407527777777, lon: 129.116986111111, name: '부산광역시 수영구 남천제2동', type: '행정동', admin_parent: '부산광역시 수영구', legal_divisions: ['남천동']});
addLocation('수영동', {lat: 35.1673583333333, lon: 129.118288888888, name: '부산광역시 수영구 수영동', type: '행정동', admin_parent: '부산광역시 수영구', legal_divisions: ['수영동']});
addLocation('망미제1동', {lat: 35.1713555555555, lon: 129.103241666666, name: '부산광역시 수영구 망미제1동', type: '행정동', admin_parent: '부산광역시 수영구', legal_divisions: ['망미동']});
addLocation('망미제2동', {lat: 35.1721527777777, lon: 129.117541666666, name: '부산광역시 수영구 망미제2동', type: '행정동', admin_parent: '부산광역시 수영구', legal_divisions: ['망미동']});
addLocation('광안제1동', {lat: 35.1598666666666, lon: 129.114730555555, name: '부산광역시 수영구 광안제1동', type: '행정동', admin_parent: '부산광역시 수영구', legal_divisions: ['광안동'], aliases: ['광안리']});
addLocation('광안제2동', {lat: 35.1506777777777, lon: 129.114866666666, name: '부산광역시 수영구 광안제2동', type: '행정동', admin_parent: '부산광역시 수영구', legal_divisions: ['광안동']});
addLocation('광안제3동', {lat: 35.1648222222222, lon: 129.115855555555, name: '부산광역시 수영구 광안제3동', type: '행정동', admin_parent: '부산광역시 수영구', legal_divisions: ['광안동']});
addLocation('광안제4동', {lat: 35.1519666666666, lon: 129.113666666666, name: '부산광역시 수영구 광안제4동', type: '행정동', admin_parent: '부산광역시 수영구', legal_divisions: ['광안동']});
addLocation('민락동', {lat: 35.1541666666666, lon: 129.127677777777, name: '부산광역시 수영구 민락동', type: '행정동', admin_parent: '부산광역시 수영구', legal_divisions: ['민락동']});

// 부산광역시 사상구 (기초자치단체)
addLocation('사상구', {name: '부산광역시 사상구', type: '기초자치단체', admin_parent: '부산광역시', aliases: ['사상구']});
// 부산광역시 사상구 행정동
addLocation('삼락동', {lat: 35.1738944444444, lon: 128.979966666666, name: '부산광역시 사상구 삼락동', type: '행정동', admin_parent: '부산광역시 사상구', legal_divisions: ['삼락동']});
addLocation('모라제1동', {lat: 35.1845361111111, lon: 128.989688888888, name: '부산광역시 사상구 모라제1동', type: '행정동', admin_parent: '부산광역시 사상구', legal_divisions: ['모라동']});
addLocation('모라제3동', {lat: 35.1815583333333, lon: 128.998333333333, name: '부산광역시 사상구 모라제3동', type: '행정동', admin_parent: '부산광역시 사상구', legal_divisions: ['모라동']});
addLocation('덕포제1동', {lat: 35.1672833333333, lon: 128.985530555555, name: '부산광역시 사상구 덕포제1동', type: '행정동', admin_parent: '부산광역시 사상구', legal_divisions: ['덕포동']});
addLocation('덕포제2동', {lat: 35.1713805555555, lon: 128.985177777777, name: '부산광역시 사상구 덕포제2동', type: '행정동', admin_parent: '부산광역시 사상구', legal_divisions: ['덕포동']});
addLocation('괘법동', {lat: 35.1606722222222, lon: 128.989444444444, name: '부산광역시 사상구 괘법동', type: '행정동', admin_parent: '부산광역시 사상구', legal_divisions: ['괘법동']});
addLocation('감전동', {lat: 35.1512333333333, lon: 128.981708333333, name: '부산광역시 사상구 감전동', type: '행정동', admin_parent: '부산광역시 사상구', legal_divisions: ['감전동']});
addLocation('주례제1동', {lat: 35.1486194444444, lon: 129.000144444444, name: '부산광역시 사상구 주례제1동', type: '행정동', admin_parent: '부산광역시 사상구', legal_divisions: ['주례동']});
addLocation('주례제2동', {lat: 35.1469888888888, lon: 129.012733333333, name: '부산광역시 사상구 주례제2동', type: '행정동', admin_parent: '부산광역시 사상구', legal_divisions: ['주례동']});
addLocation('주례제3동', {lat: 35.1442888888888, lon: 129.003722222222, name: '부산광역시 사상구 주례제3동', type: '행정동', admin_parent: '부산광역시 사상구', legal_divisions: ['주례동']});
addLocation('학장동', {lat: 35.1409916666666, lon: 128.989677777777, name: '부산광역시 사상구 학장동', type: '행정동', admin_parent: '부산광역시 사상구', legal_divisions: ['학장동']});
addLocation('엄궁동', {lat: 35.1256, lon: 128.974444444444, name: '부산광역시 사상구 엄궁동', type: '행정동', admin_parent: '부산광역시 사상구', legal_divisions: ['엄궁동']});

// 부산광역시 기장군 (기초자치단체)
addLocation('기장군', {name: '부산광역시 기장군', type: '기초자치단체', admin_parent: '부산광역시', aliases: ['기장군']});
// 부산광역시 기장군 읍·면
addLocation('기장읍', {lat: 35.2356027777777, lon: 129.218177777777, name: '부산광역시 기장군 기장읍', type: '읍', admin_parent: '부산광역시 기장군', legal_divisions: ['대라리, 동부리, 서부리, 죽성리, 연화리, 대변리, 청강리, 시랑리, 만화리, 석산리, 교리, 대룡리, 용소리']});
addLocation('장안읍', {lat: 35.3107027777777, lon: 129.246288888888, name: '부산광역시 기장군 장안읍', type: '읍', admin_parent: '부산광역시 기장군', legal_divisions: ['좌천리, 임랑리, 길천리, 반룡리, 명례리, 월내리, 덕선리, 오리, 장안리']});
addLocation('정관읍', {lat: 35.322375, lon: 129.182677777777, name: '부산광역시 기장군 정관읍', type: '읍', admin_parent: '부산광역시 기장군', legal_divisions: ['방곡리, 병산리, 달산리, 예림리, 임곡리, 웅천리, 용수리, 매학리, 월평리, 곰내리, 두명리']});
addLocation('일광읍', {lat: 35.2639371829939, lon: 129.23228251585, name: '부산광역시 기장군 일광읍', type: '읍', admin_parent: '부산광역시 기장군', legal_divisions: ['삼성리, 학리, 동백리, 칠암리, 문동리, 횡계리, 용천리, 원리, 이천리']});
addLocation('철마면', {lat: 35.2721972222222, lon: 129.152022222222, name: '부산광역시 기장군 철마면', type: '면', admin_parent: '부산광역시 기장군', legal_divisions: ['연구리, 송정리, 장전리, 웅천리, 고촌리, 백길리, 와여리, 이곡리, 미동리']});




 // =============================================================
    // 대구광역시 (광역자치단체)
    addLocation({ name: '대구광역시', lat: 35.8685416666666, lon: 128.603552777777, type: '광역자치단체', admin_parent: '', aliases: ['대구'] });

    // =============================================================
    // 대구광역시 중구 (기초자치단체)
    addLocation({ name: '대구광역시 중구', admin_parent: '대구광역시', aliases: ['중구'] });
    // 대구광역시 중구 행정동
    addLocation({ name: '대구광역시 중구 동인동', lat: 35.86790482, lon: 128.609131, type: '행정동', admin_parent: '대구광역시 중구', legal_divisions: ['동인동1가', '동인동2가', '동인동3가', '동인동4가'] });
    addLocation({ name: '대구광역시 중구 삼덕동', lat: 35.862575, lon: 128.611166666666, type: '행정동', admin_parent: '대구광역시 중구', legal_divisions: ['삼덕동1가', '삼덕동2가', '삼덕동3가'] });
    addLocation({ name: '대구광역시 중구 성내1동', lat: 35.86625, lon: 128.600355555555, type: '행정동', admin_parent: '대구광역시 중구', legal_divisions: ['성내1가', '태평로1가', '북성로1가', '화전동', '향촌동', '교동'] });
    addLocation({ name: '대구광역시 중구 성내2동', lat: 35.8653472222222, lon: 128.592622222222, type: '행정동', admin_parent: '대구광역시 중구', legal_divisions: ['성내2가', '서성로1가', '서성로2가', '달성동'] });
    addLocation({ name: '대구광역시 중구 성내3동', lat: 35.8696111111111, lon: 128.587941666666, type: '행정동', admin_parent: '대구광역시 중구', legal_divisions: ['성내3가', '태평로2가', '태평로3가', '북성로2가'] });
    addLocation({ name: '대구광역시 중구 대신동', lat: 35.8632027777777, lon: 128.579444444444, type: '행정동', admin_parent: '대구광역시 중구', legal_divisions: ['대신동'] });
    addLocation({ name: '대구광역시 중구 남산1동', lat: 35.8563944444444, lon: 128.592644444444, type: '행정동', admin_parent: '대구광역시 중구', legal_divisions: ['남산동'] });
    addLocation({ name: '대구광역시 중구 남산2동', lat: 35.8610611111111, lon: 128.591755555555, type: '행정동', admin_parent: '대구광역시 중구', legal_divisions: ['남산동'] });
    addLocation({ name: '대구광역시 중구 남산3동', lat: 35.8565333333333, lon: 128.587197222222, type: '행정동', admin_parent: '대구광역시 중구', legal_divisions: ['남산동'] });
    addLocation({ name: '대구광역시 중구 남산4동', lat: 35.8552388888888, lon: 128.582719444444, type: '행정동', admin_parent: '대구광역시 중구', legal_divisions: ['남산동'] });
    addLocation({ name: '대구광역시 중구 대봉1동', lat: 35.8586722222222, lon: 128.606575, type: '행정동', admin_parent: '대구광역시 중구', legal_divisions: ['대봉동', '봉산동'] });
    addLocation({ name: '대구광역시 중구 대봉2동', lat: 35.8552055555555, lon: 128.601952777777, type: '행정동', admin_parent: '대구광역시 중구',
        legal_divisions: ['대봉동', '봉산동', '공평동', '동문동', '문화동', '사일동', '상덕동', '용덕동', '포정동', '하서동', '전동', '완전동', '서문로1가', '서문로2가', '종로1가', '종로2가', '동성로1가', '동성로2가', '동성로3가']
    });


    // =============================================================
    // 대구광역시 동구 (기초자치단체)
    addLocation({ name: '대구광역시 동구', admin_parent: '대구광역시', aliases: ['동구', '팔공산'] });
    // 대구광역시 동구 행정동
    addLocation({ name: '대구광역시 동구 신암1동', lat: 35.8812777777777, lon: 128.618552777777, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['신암동'] });
    addLocation({ name: '대구광역시 동구 신암2동', lat: 35.8764277777777, lon: 128.616533333333, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['신암동'] });
    addLocation({ name: '대구광역시 동구 신암3동', lat: 35.8766277777777, lon: 128.625375, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['신암동'] });
    addLocation({ name: '대구광역시 동구 신암4동', lat: 35.8820972222222, lon: 128.631511111111, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['신암동'] });
    addLocation({ name: '대구광역시 동구 신암5동', lat: 35.886725, lon: 128.635244444444, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['신암동'] });
    addLocation({ name: '대구광역시 동구 신천1.2동', lat: 35.8671194444444, lon: 128.616797222222, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['신천동'] });
    addLocation({ name: '대구광역시 동구 신천3동', lat: 35.8722666666666, lon: 128.625897222222, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['신천동'] });
    addLocation({ name: '대구광역시 동구 신천4동', lat: 35.8687861111111, lon: 128.631486111111, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['신천동'] });
    addLocation({ name: '대구광역시 동구 효목1동', lat: 35.8781555555555, lon: 128.647466666666, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['효목동'] });
    addLocation({ name: '대구광역시 동구 효목2동', lat: 35.8746361111111, lon: 128.640422222222, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['효목동'] });
    addLocation({ name: '대구광역시 동구 도평동', lat: 35.9079305555555, lon: 128.655986111111, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['도평동'] });
    addLocation({ name: '대구광역시 동구 불로.봉무동', lat: 35.9072833333333, lon: 128.641622222222, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['불로동', '봉무동'] });
    addLocation({ name: '대구광역시 동구 지저동', lat: 35.8907305555555, lon: 128.640455555555, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['지저동'] });
    addLocation({ name: '대구광역시 동구 동촌동', lat: 35.8838888888888, lon: 128.6519, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['동촌동'] });
    addLocation({ name: '대구광역시 동구 방촌동', lat: 35.8770833333333, lon: 128.667475, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['방촌동'] });
    addLocation({ name: '대구광역시 동구 해안동', lat: 35.8921916666666, lon: 128.684330555555, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['해안동'] });
    addLocation({ name: '대구광역시 동구 안심1동', lat: 35.8673833333333, lon: 128.704330555555, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['안심동'] });
    addLocation({ name: '대구광역시 동구 안심2동', lat: 35.8724361111111, lon: 128.689263888888, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['안심동'] });
    addLocation({ name: '대구광역시 동구 안심3동', lat: 35.8678684, lon: 128.7224295, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['안심동'] });
    addLocation({ name: '대구광역시 동구 안심4동', lat: 35.870105, lon: 128.711046, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['안심동'] });
    addLocation({ name: '대구광역시 동구 혁신동', lat: 35.8796992, lon: 128.7109768, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['혁신동'] });
    addLocation({ name: '대구광역시 동구 공산동', lat: 35.9372222222222, lon: 128.646466666666, type: '행정동', admin_parent: '대구광역시 동구', legal_divisions: ['공산동'] });

    // =============================================================
    // 대구광역시 서구 (기초자치단체)
    addLocation({ name: '대구광역시 서구', admin_parent: '대구광역시', aliases: ['서구'] });
    // 대구광역시 서구 행정동
    addLocation({ name: '대구광역시 서구 내당1동', lat: 35.857675, lon: 128.562963888888, type: '행정동', admin_parent: '대구광역시 서구', legal_divisions: ['내당동'] });
    addLocation({ name: '대구광역시 서구 내당2.3동', lat: 35.8642833333333, lon: 128.576688888888, type: '행정동', admin_parent: '대구광역시 서구', legal_divisions: ['내당동'] });
    addLocation({ name: '대구광역시 서구 내당4동', lat: 35.8577666666666, lon: 128.553808333333, type: '행정동', admin_parent: '대구광역시 서구', legal_divisions: ['내당동'] });
    addLocation({ name: '대구광역시 서구 비산1동', lat: 35.8781916666666, lon: 128.571241666666, type: '행정동', admin_parent: '대구광역시 서구', legal_divisions: ['비산동'] });
    addLocation({ name: '대구광역시 서구 비산2.3동', lat: 35.8727222222222, lon: 128.576975, type: '행정동', admin_parent: '대구광역시 서구', legal_divisions: ['비산동'] });
    addLocation({ name: '대구광역시 서구 비산4동', lat: 35.8667833333333, lon: 128.576297222222, type: '행정동', admin_parent: '대구광역시 서구', legal_divisions: ['비산동'] });
    addLocation({ name: '대구광역시 서구 비산5동', lat: 35.8833777777777, lon: 128.571844444444, type: '행정동', admin_parent: '대구광역시 서구', legal_divisions: ['비산동'] });
    addLocation({ name: '대구광역시 서구 비산6동', lat: 35.8733333333333, lon: 128.571330555555, type: '행정동', admin_parent: '대구광역시 서구', legal_divisions: ['비산동'] });
    addLocation({ name: '대구광역시 서구 비산7동', lat: 35.8850361111111, lon: 128.555741666666, type: '행정동', admin_parent: '대구광역시 서구', legal_divisions: ['비산동'] });
    addLocation({ name: '대구광역시 서구 평리1동', lat: 35.8726055555555, lon: 128.565488888888, type: '행정동', admin_parent: '대구광역시 서구', legal_divisions: ['평리동'] });
    addLocation({ name: '대구광역시 서구 평리2동', lat: 35.8682638888888, lon: 128.565963888888, type: '행정동', admin_parent: '대구광역시 서구', legal_divisions: ['평리동'] });
    addLocation({ name: '대구광역시 서구 평리3동', lat: 35.8728833333333, lon: 128.563519444444, type: '행정동', admin_parent: '대구광역시 서구', legal_divisions: ['평리동'] });
    addLocation({ name: '대구광역시 서구 평리4동', lat: 35.8643444444444, lon: 128.558888888888, type: '행정동', admin_parent: '대구광역시 서구', legal_divisions: ['평리동'] });
    addLocation({ name: '대구광역시 서구 평리5동', lat: 35.8708, lon: 128.550955555555, type: '행정동', admin_parent: '대구광역시 서구', legal_divisions: ['평리동'] });
    addLocation({ name: '대구광역시 서구 평리6동', lat: 35.8722416666666, lon: 128.550333333333, type: '행정동', admin_parent: '대구광역시 서구', legal_divisions: ['평리동'] });
    addLocation({ name: '대구광역시 서구 상중이동', lat: 35.8649833333333, lon: 128.546477777777, type: '행정동', admin_parent: '대구광역시 서구', legal_divisions: ['상리동', '중리동', '이현동'] });
    addLocation({ name: '대구광역시 서구 원대동', lat: 35.8837861111111, lon: 128.576622222222, type: '행정동', admin_parent: '대구광역시 서구', legal_divisions: ['원대동'] });


    // 대구광역시 남구 (기초자치단체)
    addLocation({ name: '대구광역시 남구', admin_parent: '대구광역시', aliases: ['남구'] });
    // 대구광역시 남구 행정동
    addLocation({ name: '대구광역시 남구 이천동', lat: 35.8507138888888, lon: 128.601666666666, type: '행정동', admin_parent: '대구광역시 남구', legal_divisions: ['이천동'] });
    addLocation({ name: '대구광역시 남구 봉덕1동', lat: 35.8425694444444, lon: 128.600111111111, type: '행정동', admin_parent: '대구광역시 남구', legal_divisions: ['봉덕동'] });
    addLocation({ name: '대구광역시 남구 봉덕2동', lat: 35.8408555555555, lon: 128.603288888888, type: '행정동', admin_parent: '대구광역시 남구', legal_divisions: ['봉덕동'] });
    addLocation({ name: '대구광역시 남구 봉덕3동', lat: 35.8386944444444, lon: 128.600463888888, type: '행정동', admin_parent: '대구광역시 남구', legal_divisions: ['봉덕동'] });
    addLocation({ name: '대구광역시 남구 대명1동', lat: 35.8372805555555, lon: 128.579122222222, type: '행정동', admin_parent: '대구광역시 남구', legal_divisions: ['대명동'] });
    addLocation({ name: '대구광역시 남구 대명2동', lat: 35.8523055555555, lon: 128.588877777777, type: '행정동', admin_parent: '대구광역시 남구', legal_divisions: ['대명동'] });
    addLocation({ name: '대구광역시 남구 대명3동', lat: 35.8493638888888, lon: 128.581322222222, type: '행정동', admin_parent: '대구광역시 남구', legal_divisions: ['대명동'] });
    addLocation({ name: '대구광역시 남구 대명4동', lat: 35.8449527777777, lon: 128.574555555555, type: '행정동', admin_parent: '대구광역시 남구', legal_divisions: ['대명동'] });
    addLocation({ name: '대구광역시 남구 대명5동', lat: 35.8402611111111, lon: 128.589988888888, type: '행정동', admin_parent: '대구광역시 남구', legal_divisions: ['대명동'] });
    addLocation({ name: '대구광역시 남구 대명6동', lat: 35.8320916666666, lon: 128.568044444444, type: '행정동', admin_parent: '대구광역시 남구', legal_divisions: ['대명동'] });
    addLocation({ name: '대구광역시 남구 대명9동', lat: 35.8342722222222, lon: 128.581397222222, type: '행정동', admin_parent: '대구광역시 남구', legal_divisions: ['대명동'] });
    addLocation({ name: '대구광역시 남구 대명10동', lat: 35.83705, lon: 128.571188888888, type: '행정동', admin_parent: '대구광역시 남구', legal_divisions: ['대명동'] });
    addLocation({ name: '대구광역시 남구 대명11동', lat: 35.8331638888888, lon: 128.562652777777, type: '행정동', admin_parent: '대구광역시 남구', legal_divisions: ['대명동'] });

    // =============================================================
    // 대구광역시 북구 (기초자치단체)
    addLocation({ name: '대구광역시 북구', admin_parent: '대구광역시', aliases: ['북구'] });
    // 대구광역시 북구 행정동
    addLocation({ name: '대구광역시 북구 고성동', lat: 35.87895, lon: 128.585822222222, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['고성동'] });
    addLocation({ name: '대구광역시 북구 칠성동', lat: 35.8762111111111, lon: 128.602108333333, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['칠성동'] });
    addLocation({ name: '대구광역시 북구 침산1동', lat: 35.887375, lon: 128.583388888888, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['침산동'] });
    addLocation({ name: '대구광역시 북구 침산2동', lat: 35.8842722222222, lon: 128.599175, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['침산동'] });
    addLocation({ name: '대구광역시 북구 침산3동', lat: 35.8891444444444, lon: 128.591552777777, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['침산동'] });
    addLocation({ name: '대구광역시 북구 산격1동', lat: 35.8896527777777, lon: 128.596911111111, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['산격동'] });
    addLocation({ name: '대구광역시 북구 산격2동', lat: 35.8987111111111, lon: 128.611486111111, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['산격동'] });
    addLocation({ name: '대구광역시 북구 산격3동', lat: 35.8905305555555, lon: 128.610497222222, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['산격동'] });
    addLocation({ name: '대구광역시 북구 산격4동', lat: 35.8893055555555, lon: 128.606419444444, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['산격동'] });
    addLocation({ name: '대구광역시 북구 대현동', lat: 35.88218385, lon: 128.6058302, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['대현동'] });
    addLocation({ name: '대구광역시 북구 복현1동', lat: 35.8907388888888, lon: 128.620752777777, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['복현동'] });
    addLocation({ name: '대구광역시 북구 복현2동', lat: 35.8924361111111, lon: 128.627663888888, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['복현동'] });
    addLocation({ name: '대구광역시 북구 검단동', lat: 35.9104555555555, lon: 128.6294, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['검단동'] });
    addLocation({ name: '대구광역시 북구 무태조야동', lat: 35.9182944444444, lon: 128.5994, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['무태동', '조야동'] });
    addLocation({ name: '대구광역시 북구 관문동', lat: 35.8986722222222, lon: 128.544377777777, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['관음동', '팔달동', '매천동', '금호동', '사수동'] });
    addLocation({ name: '대구광역시 북구 태전1동', lat: 35.9207222222222, lon: 128.545799999999, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['태전동'] });
    addLocation({ name: '대구광역시 북구 태전2동', lat: 35.9185305555555, lon: 128.551011111111, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['태전동'] });
    addLocation({ name: '대구광역시 북구 구암동', lat: 35.9373694444444, lon: 128.571641666666, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['구암동'] });
    addLocation({ name: '대구광역시 북구 관음동', lat: 35.9413722222222, lon: 128.549630555555, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['관음동'] });
    addLocation({ name: '대구광역시 북구 읍내동', lat: 35.9426166666666, lon: 128.553077777777, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['읍내동'] });
    addLocation({ name: '대구광역시 북구 동천동', lat: 35.9401222222222, lon: 128.557733333333, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['동천동'] });
    addLocation({ name: '대구광역시 북구 노원동', lat: 35.8901321, lon: 128.5762125, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['노원동'] });
    addLocation({ name: '대구광역시 북구 국우동', lat: 35.9480283, lon: 128.5754397, type: '행정동', admin_parent: '대구광역시 북구', legal_divisions: ['국우동', '학정동', '연경동'] });

    // 대구광역시 수성구 (기초자치단체)
    addLocation({ name: '대구광역시 수성구', admin_parent: '대구광역시', aliases: ['수성구', '수성못'] });
    // 대구광역시 수성구 행정동
    addLocation({ name: '대구광역시 수성구 범어1동', lat: 35.8525, lon: 128.624277777777, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['범어동'] });
    addLocation({ name: '대구광역시 수성구 범어2동', lat: 35.8571138888888, lon: 128.633530555555, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['범어동'] });
    addLocation({ name: '대구광역시 수성구 범어3동', lat: 35.8631638888888, lon: 128.620088888888, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['범어동'] });
    addLocation({ name: '대구광역시 수성구 범어4동', lat: 35.8551472222222, lon: 128.643477777777, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['범어동'] });
    addLocation({ name: '대구광역시 수성구 만촌1동', lat: 35.8699138888888, lon: 128.649108333333, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['만촌동'] });
    addLocation({ name: '대구광역시 수성구 만촌2동', lat: 35.8568972222222, lon: 128.649419444444, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['만촌동'] });
    addLocation({ name: '대구광역시 수성구 만촌3동', lat: 35.8525055555555, lon: 128.652719444444, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['만촌동'] });
    addLocation({ name: '대구광역시 수성구 수성1가동', lat: 35.8533944444444, lon: 128.6129, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['수성동'] });
    addLocation({ name: '대구광역시 수성구 수성2.3가동', lat: 35.8527861111111, lon: 128.621344444444, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['수성동'] });
    addLocation({ name: '대구광역시 수성구 수성4가동', lat: 35.8596833333333, lon: 128.618863888888, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['수성동'] });
    addLocation({ name: '대구광역시 수성구 황금1동', lat: 35.8409611111111, lon: 128.640422222222, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['황금동'] });
    addLocation({ name: '대구광역시 수성구 황금2동', lat: 35.8385555555555, lon: 128.627441666666, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['황금동'] });
    addLocation({ name: '대구광역시 수성구 중동', lat: 35.8444027777777, lon: 128.617222222222, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['중동'] });
    addLocation({ name: '대구광역시 수성구 상동', lat: 35.8291583333333, lon: 128.617622222222, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['상동'] });
    addLocation({ name: '대구광역시 수성구 파동', lat: 35.8124444444444, lon: 128.617311111111, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['파동'] });
    addLocation({ name: '대구광역시 수성구 두산동', lat: 35.82635, lon: 128.622808333333, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['두산동'] });
    addLocation({ name: '대구광역시 수성구 지산1동', lat: 35.8218888888888, lon: 128.639352777777, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['지산동'] });
    addLocation({ name: '대구광역시 수성구 지산2동', lat: 35.8201388888888, lon: 128.630252777777, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['지산동'] });
    addLocation({ name: '대구광역시 수성구 범물1동', lat: 35.8148222222222, lon: 128.648186111111, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['범물동'] });
    addLocation({ name: '대구광역시 수성구 범물2동', lat: 35.8146194444444, lon: 128.645677777777, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['범물동'] });
    addLocation({ name: '대구광역시 수성구 고산1동', lat: 35.8341416666666, lon: 128.714641666666, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['고산동'] });
    addLocation({ name: '대구광역시 수성구 고산2동', lat: 35.8403472222222, lon: 128.697344444444, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['고산동'] });
    addLocation({ name: '대구광역시 수성구 고산3동', lat: 35.8412722222222, lon: 128.708911111111, type: '행정동', admin_parent: '대구광역시 수성구', legal_divisions: ['고산동'] });

    // =============================================================
    // 대구광역시 달서구 (기초자치단체)
    addLocation({ name: '대구광역시 달서구', admin_parent: '대구광역시', aliases: ['달서구'] });
    // 대구광역시 달서구 행정동
    addLocation({ name: '대구광역시 달서구 성당동', lat: 35.84294152, lon: 128.549565, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['성당동'] });
    addLocation({ name: '대구광역시 달서구 두류1.2동', lat: 35.85569344, lon: 128.572198, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['두류동'] });
    addLocation({ name: '대구광역시 달서구 두류3동', lat: 35.8507138888888, lon: 128.557644444444, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['두류동'] });
    addLocation({ name: '대구광역시 달서구 감삼동', lat: 35.8480694444444, lon: 128.544377777777, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['감삼동'] });
    addLocation({ name: '대구광역시 달서구 죽전동', lat: 35.8528388888888, lon: 128.542, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['죽전동'] });
    addLocation({ name: '대구광역시 달서구 장기동', lat: 35.8403916666666, lon: 128.532177777777, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['장기동'] });
    addLocation({ name: '대구광역시 달서구 용산1동', lat: 35.8537166666666, lon: 128.533544444444, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['용산동'] });
    addLocation({ name: '대구광역시 달서구 용산2동', lat: 35.8554388888888, lon: 128.525152777777, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['용산동'] });
    addLocation({ name: '대구광역시 달서구 이곡1동', lat: 35.8487, lon: 128.5128, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['이곡동'] });
    addLocation({ name: '대구광역시 달서구 이곡2동', lat: 35.852825, lon: 128.503097222222, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['이곡동'] });
    addLocation({ name: '대구광역시 달서구 신당동', lat: 35.8560333333333, lon: 128.501044444444, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['신당동'] });
    addLocation({ name: '대구광역시 달서구 본리동', lat: 35.8391277777777, lon: 128.539852777777, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['본리동'] });
    addLocation({ name: '대구광역시 달서구 월성1동', lat: 35.8166499999999, lon: 128.525177777777, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['월성동'] });
    addLocation({ name: '대구광역시 달서구 월성2동', lat: 35.8279555555555, lon: 128.530497222222, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['월성동'] });
    addLocation({ name: '대구광역시 달서구 진천동', lat: 35.8122, lon: 128.526675, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['진천동'] });
    addLocation({ name: '대구광역시 달서구 유천동', lat: 35.8172711258048, lon: 128.514012692477, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['유천동'] });
    addLocation({ name: '대구광역시 달서구 상인1동', lat: 35.8112555555555, lon: 128.547197222222, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['상인동'] });
    addLocation({ name: '대구광역시 달서구 상인2동', lat: 35.8095416666666, lon: 128.538519444444, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['상인동'] });
    addLocation({ name: '대구광역시 달서구 상인3동', lat: 35.8070888888888, lon: 128.552419444444, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['상인동'] });
    addLocation({ name: '대구광역시 달서구 도원동', lat: 35.8044666666666, lon: 128.5344, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['도원동'] });
    addLocation({ name: '대구광역시 달서구 송현1동', lat: 35.8263805555555, lon: 128.555619444444, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['송현동'] });
    addLocation({ name: '대구광역시 달서구 송현2동', lat: 35.8298361111111, lon: 128.547819444444, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['송현동'] });
    addLocation({ name: '대구광역시 달서구 본동', lat: 35.8314861111111, lon: 128.543288888888, type: '행정동', admin_parent: '대구광역시 달서구', legal_divisions: ['본동'] });


 
    // 대구광역시 달성군 (기초자치단체)
    addLocation({ name: '대구광역시 달성군', admin_parent: '대구광역시', aliases: ['달성군'] });
    // 대구광역시 달성군 읍·면
    addLocation({ name: '대구광역시 달성군 화원읍', lat: 35.8011166666666, lon: 128.503055555555, type: '읍', admin_parent: '대구광역시 달성군', legal_divisions: ['천내리, 명곡리, 구라리, 성산리, 대곡리, 본리리, 마비정리']});
    addLocation({ name: '대구광역시 달성군 논공읍', lat: 35.7711, lon: 128.422555555555, type: '읍', admin_parent: '대구광역시 달성군', legal_divisions: ['위천리, 남리, 상리, 하리, 북리, 삼리, 본리, 금포리, 하리']});
    addLocation({ name: '대구광역시 달성군 다사읍', lat: 35.8588333333333, lon: 128.456175, type: '읍', admin_parent: '대구광역시 달성군', legal_divisions: ['매곡리, 죽곡리, 이천리, 문산리, 서재리, 방천리, 강정리, 하빈리, 다사리']});
    addLocation({ name: '대구광역시 달성군 유가읍', lat: 35.693876, lon: 128.459773, type: '읍', admin_parent: '대구광역시 달성군', legal_divisions: ['쌍계리, 유곡리, 용리, 음리, 가태리, 초곡리, 봉리, 본신리, 양리, 상리']});
    addLocation({ name: '대구광역시 달성군 옥포읍', lat: 35.7866416666666, lon: 128.465977777777, type: '읍', admin_parent: '대구광역시 달성군', legal_divisions: ['교항리, 강림리, 간경리, 기세리, 신당리, 송정리, 반송리, 본리, 원상리']});
    addLocation({ name: '대구광역시 달성군 현풍읍', lat: 35.6943138888888, lon: 128.449786111111, type: '읍', admin_parent: '대구광역시 달성군', legal_divisions: ['성하리, 성산리, 상리, 중리, 하리, 대리, 오산리, 원교리, 자모리, 내리, 부동리']});
    addLocation({ name: '대구광역시 달성군 가창면', lat: 35.7998305555555, lon: 128.624688888888, type: '면', admin_parent: '대구광역시 달성군', legal_divisions: ['용계리, 단산리, 정대리, 주리, 오리, 삼산리, 대일동, 신원리, 옥분리, 냉천리, 상원리']});
    addLocation({ name: '대구광역시 달성군 하빈면', lat: 35.8979444444444, lon: 128.447711111111, type: '면', admin_parent: '대구광역시 달성군', legal_divisions: ['하산리, 감문리, 대평리, 동곡리, 무학리, 봉촌리, 기곡리, 묘리, 강정리']});
    addLocation({ name: '대구광역시 달성군 구지면', lat: 35.6557638888888, lon: 128.415666666666, type: '면', admin_parent: '대구광역시 달성군', legal_divisions: ['창리, 오설리, 가천리, 평촌리, 예현리, 내리, 외리, 응암리, 대암리, 목단리, 화원리']});


    // 대구광역시 군위군 (기초자치단체)
    addLocation({ name: '대구광역시 군위군', admin_parent: '대구광역시', aliases: ['군위군'] });
    // 대구광역시 군위군 읍·면
    addLocation({ name: '대구광역시 군위군 군위읍', lat: 36.2369194444444, lon: 128.571019444444, type: '읍', admin_parent: '대구광역시 군위군', legal_divisions: ['동부리, 서부리, 대천리, 삽령리, 사직리, 하곡리, 상곡리, 수서리']});
    addLocation({ name: '대구광역시 군위군 소보면', lat: 36.2519055555555, lon: 128.477622222222, type: '면', admin_parent: '대구광역시 군위군', legal_divisions: ['송원리, 내의리, 봉소리, 복성리, 보현리, 달산리, 대성리, 산법리, 사리']});
    addLocation({ name: '대구광역시 군위군 효령면', lat: 36.1538777777777, lon: 128.587677777777, type: '면', admin_parent: '대구광역시 군위군', legal_divisions: ['병수리, 장군리, 매곡리, 불로리, 성리, 화계리, 백천리, 오천리, 중구리, 마시리, 거매리']});
    addLocation({ name: '대구광역시 군위군 부계면', lat: 36.0979083333333, lon: 128.666452777777, type: '면', admin_parent: '대구광역시 군위군', legal_divisions: ['창평리, 동산리, 가호리, 남산리, 대율리, 동원리, 일연리']});
    addLocation({ name: '대구광역시 군위군 우보면', lat: 36.1920361111111, lon: 128.664041666666, type: '면', admin_parent: '대구광역시 군위군', legal_divisions: ['미성리, 두북리, 이화리, 선곡리, 봉산리, 나호리, 달산리, 모산리, 동곡리']});
    addLocation({ name: '대구광역시 군위군 의흥면', lat: 36.172875, lon: 128.717408333333, type: '면', admin_parent: '대구광역시 군위군', legal_divisions: ['읍내리, 파전리, 수북리, 이전리, 매곡리, 지호리, 눌산리']});
    addLocation({ name: '대구광역시 군위군 산성면', lat: 36.1201444444444, lon: 128.697197222222, type: '면', admin_parent: '대구광역시 군위군', legal_divisions: ['연구리, 무암리, 화전리, 봉림리, 화본리, 백학리, 원산리']});
    addLocation({ name: '대구광역시 군위군 삼국유사면', lat: 36.1180083333333, lon: 128.791486111111, type: '면', admin_parent: '대구광역시 군위군', legal_divisions: ['낙전리, 송죽리, 장군리, 웅곡리, 내량리, 화산리, 학암리, 용천리, 송계리']});






    // =============================================================
    // 대전광역시 (광역자치단체)
    addLocation({ lat: 36.3471194444444, lon: 127.386566666666, name: '대전광역시', type: '광역자치단체', admin_parent: '', aliases: ['대전'] });

    // =============================================================
    // 대전광역시 동구 (기초자치단체)
    addLocation({ name: '대전광역시 동구', type: '기초자치단체', admin_parent: '대전광역시', aliases: ['동구', '대전역'] });
    // 대전광역시 동구 행정동
    addLocation({ lat: 36.3289194444444, lon: 127.4311, name: '대전광역시 동구 중앙동', type: '행정동', admin_parent: '대전광역시 동구', legal_divisions: ['중동', '원동', '정동', '은행동', '선화동', '목동', '중촌동'] });
    addLocation({ lat: 36.3140805555555, lon: 127.443863888888, name: '대전광역시 동구 효동', type: '행정동', admin_parent: '대전광역시 동구', legal_divisions: ['효동', '천동', '가오동'] });
    addLocation({ lat: 36.323425, lon: 127.437938, name: '대전광역시 동구 신인동', type: '행정동', admin_parent: '대전광역시 동구', legal_divisions: ['신흥동', '인동'] });
    addLocation({ lat: 36.3144027777777, lon: 127.459852777777, name: '대전광역시 동구 판암1동', type: '행정동', admin_parent: '대전광역시 동구', legal_divisions: ['판암동', '삼정동'] });
    addLocation({ lat: 36.3174611111111, lon: 127.459508333333, name: '대전광역시 동구 판암2동', type: '행정동', admin_parent: '대전광역시 동구', legal_divisions: ['판암동'] });
    addLocation({ lat: 36.3251583333333, lon: 127.4636, name: '대전광역시 동구 용운동', type: '행정동', admin_parent: '대전광역시 동구', legal_divisions: ['용운동'] });
    addLocation({ lat: 36.3254166666666, lon: 127.447866666666, name: '대전광역시 동구 대동', type: '행정동', admin_parent: '대전광역시 동구', legal_divisions: ['대동', '신안동'] });
    addLocation({ lat: 36.3324611111111, lon: 127.451241666666, name: '대전광역시 동구 자양동', type: '행정동', admin_parent: '대전광역시 동구', legal_divisions: ['자양동'] });
    addLocation({ lat: 36.3440888888888, lon: 127.443577777777, name: '대전광역시 동구 가양1동', type: '행정동', admin_parent: '대전광역시 동구', legal_divisions: ['가양동'] });
    addLocation({ lat: 36.3461111111111, lon: 127.449508333333, name: '대전광역시 동구 가양2동', type: '행정동', admin_parent: '대전광역시 동구', legal_divisions: ['가양동'] });
    addLocation({ lat: 36.3551055555555, lon: 127.434411111111, name: '대전광역시 동구 용전동', type: '행정동', admin_parent: '대전광역시 동구', legal_divisions: ['용전동'] });
    addLocation({ lat: 36.3445416, lon: 127.4374361, name: '대전광역시 동구 성남동', type: '행정동', admin_parent: '대전광역시 동구', legal_divisions: ['성남동'] });
    addLocation({ lat: 36.3440361111111, lon: 127.425455555555, name: '대전광역시 동구 홍도동', type: '행정동', admin_parent: '대전광역시 동구', legal_divisions: ['홍도동'] });
    addLocation({ lat: 36.3405954, lon: 127.4221987, name: '대전광역시 동구 삼성동', type: '행정동', admin_parent: '대전광역시 동구', legal_divisions: ['삼성동'] });
    addLocation({ lat: 36.3406472222222, lon: 127.494730555555, name: '대전광역시 동구 대청동', type: '행정동', admin_parent: '대전광역시 동구', legal_divisions: ['추동', '비룡동', '주산동', '효평동', '직동', '세천동', '신상동'] });
    addLocation({ lat: 36.278625, lon: 127.469975, name: '대전광역시 동구 산내동', type: '행정동', admin_parent: '대전광역시 동구', legal_divisions: ['낭월동', '대별동', '이사동', '무수동', '구도동', '금동', '주도동', '장척동', '소호동', '오동', '상소동', '하소동'] });

    // =============================================================
    // 대전광역시 중구 (기초자치단체)
    addLocation({ name: '대전광역시 중구', type: '기초자치단체', admin_parent: '대전광역시', aliases: ['중구', '으능정이'] });
    // 대전광역시 중구 행정동
    addLocation({ lat: 36.3248444444444, lon: 127.4204, name: '대전광역시 중구 은행선화동', type: '행정동', admin_parent: '대전광역시 중구', legal_divisions: ['은행동', '선화동'] });
    addLocation({ lat: 36.33145, lon: 127.414622222222, name: '대전광역시 중구 목동', type: '행정동', admin_parent: '대전광역시 중구', legal_divisions: ['목동'] });
    addLocation({ lat: 36.33890382, lon: 127.412426, name: '대전광역시 중구 중촌동', type: '행정동', admin_parent: '대전광역시 중구', legal_divisions: ['중촌동'] });
    addLocation({ lat: 36.3173972222222, lon: 127.428030555555, name: '대전광역시 중구 대흥동', type: '행정동', admin_parent: '대전광역시 중구', legal_divisions: ['대흥동'] });
    addLocation({ lat: 36.3132722222222, lon: 127.440055555555, name: '대전광역시 중구 문창동', type: '행정동', admin_parent: '대전광역시 중구', legal_divisions: ['문창동'] });
    addLocation({ lat: 36.3067277777777, lon: 127.444533333333, name: '대전광역시 중구 석교동', type: '행정동', admin_parent: '대전광역시 중구', legal_divisions: ['석교동', '호동'] });
    addLocation({ lat: 36.3147138888888, lon: 127.426975, name: '대전광역시 중구 대사동', type: '행정동', admin_parent: '대전광역시 중구', legal_divisions: ['대사동'] });
    addLocation({ lat: 36.3112722222222, lon: 127.435822222222, name: '대전광역시 중구 부사동', type: '행정동', admin_parent: '대전광역시 중구', legal_divisions: ['부사동'] });
    addLocation({ lat: 36.3225694444444, lon: 127.412475, name: '대전광역시 중구 용두동', type: '행정동', admin_parent: '대전광역시 중구', legal_divisions: ['용두동'] });
    addLocation({ lat: 36.3226, lon: 127.405922222222, name: '대전광역시 중구 오류동', type: '행정동', admin_parent: '대전광역시 중구', legal_divisions: ['오류동'] });
    addLocation({ lat: 36.3232305555555, lon: 127.399166666666, name: '대전광역시 중구 태평1동', type: '행정동', admin_parent: '대전광역시 중구', legal_divisions: ['태평동'] });
    addLocation({ lat: 36.318325, lon: 127.395, name: '대전광역시 중구 태평2동', type: '행정동', admin_parent: '대전광역시 중구', legal_divisions: ['태평동'] });
    addLocation({ lat: 36.3121361111111, lon: 127.397366666666, name: '대전광역시 중구 유천1동', type: '행정동', admin_parent: '대전광역시 중구', legal_divisions: ['유천동'] });
    addLocation({ lat: 36.3124833333333, lon: 127.401330555555, name: '대전광역시 중구 유천2동', type: '행정동', admin_parent: '대전광역시 중구', legal_divisions: ['유천동'] });
    addLocation({ lat: 36.3124277777777, lon: 127.408641666666, name: '대전광역시 중구 문화1동', type: '행정동', admin_parent: '대전광역시 중구', legal_divisions: ['문화동'] });
    addLocation({ lat: 36.3047888888888, lon: 127.401344444444, name: '대전광역시 중구 문화2동', type: '행정동', admin_parent: '대전광역시 중구', legal_divisions: ['문화동'] });
    addLocation({ lat: 36.3024361111111, lon: 127.388219444444, name: '대전광역시 중구 산성동', type: '행정동', admin_parent: '대전광역시 중구', legal_divisions: ['산성동', '옥계동', '사정동', '안영동', '무수동', '구완동', '금동', '침산동', '정생동', '어남동', '대별동'] });

    // =============================================================
    // 대전광역시 서구 (기초자치단체)
    addLocation({ name: '대전광역시 서구', type: '기초자치단체', admin_parent: '대전광역시', aliases: ['서구'] });
    // 대전광역시 서구 행정동
    addLocation({ lat: 36.3038333333333, lon: 127.375977777777, name: '대전광역시 서구 복수동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['복수동'] });
    addLocation({ lat: 36.3130638888888, lon: 127.383186111111, name: '대전광역시 서구 도마1동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['도마동'] });
    addLocation({ lat: 36.3098305555555, lon: 127.375708333333, name: '대전광역시 서구 도마2동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['도마동'] });
    addLocation({ lat: 36.3015472222222, lon: 127.368863888888, name: '대전광역시 서구 정림동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['정림동'] });
    addLocation({ lat: 36.3229166666666, lon: 127.388888888888, name: '대전광역시 서구 변동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['변동'] });
    addLocation({ lat: 36.3336944444444, lon: 127.396388888888, name: '대전광역시 서구 용문동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['용문동'] });
    addLocation({ lat: 36.3436694444444, lon: 127.397263888888, name: '대전광역시 서구 탄방동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['탄방동'] });
    addLocation({ lat: 36.3342583333333, lon: 127.384141666666, name: '대전광역시 서구 괴정동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['괴정동'] });
    addLocation({ lat: 36.32715, lon: 127.387352777777, name: '대전광역시 서구 가장동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['가장동'] });
    addLocation({ lat: 36.3292583333333, lon: 127.379508333333, name: '대전광역시 서구 내동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['내동'] });
    addLocation({ lat: 36.3497444444444, lon: 127.369975, name: '대전광역시 서구 갈마1동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['갈마동'] });
    addLocation({ lat: 36.3437555555555, lon: 127.377022222222, name: '대전광역시 서구 갈마2동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['갈마동'] });
    addLocation({ lat: 36.3517583333333, lon: 127.359730555555, name: '대전광역시 서구 월평1동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['월평동'] });
    addLocation({ lat: 36.3606305555555, lon: 127.376233333333, name: '대전광역시 서구 월평2동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['월평동'] });
    addLocation({ lat: 36.3573611111111, lon: 127.369, name: '대전광역시 서구 월평3동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['월평동'] });
    addLocation({ lat: 36.3006166666666, lon: 127.351411111111, name: '대전광역시 서구 가수원동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['가수원동'] });
    addLocation({ lat: 36.3236179406995, lon: 127.346732378171, name: '대전광역시 서구 도안동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['도안동', '용계동', '학하동', '상대동'] });
    addLocation({ lat: 36.3009111111111, lon: 127.3394, name: '대전광역시 서구 관저1동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['관저동'] });
    addLocation({ lat: 36.2962111111111, lon: 127.337222222222, name: '대전광역시 서구 관저2동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['관저동'] });
    addLocation({ lat: 36.2529305555555, lon: 127.343763888888, name: '대전광역시 서구 기성동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['흑석동', '매노동', '장안동', '평촌동', '오동', '우명동', '원정동', '용촌동', '봉곡동', '덕명동', '성북동', '세동'] });
    addLocation({ lat: 36.3495194444444, lon: 127.387941666666, name: '대전광역시 서구 둔산1동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['둔산동', '갈마동'] });
    addLocation({ lat: 36.3508472222222, lon: 127.385652777777, name: '대전광역시 서구 둔산2동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['둔산동', '탄방동'] });
    addLocation({ lat: 36.3646277777777, lon: 127.377130555555, name: '대전광역시 서구 만년동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['만년동'] });
    addLocation({ lat: 36.3534312, lon: 127.4000006, name: '대전광역시 서구 둔산3동', type: '행정동', admin_parent: '대전광역시 서구', legal_divisions: ['둔산동', '월평동'] });

    // =============================================================
    // 대전광역시 유성구 (기초자치단체)
    addLocation({ name: '대전광역시 유성구', type: '기초자치단체', admin_parent: '대전광역시', aliases: ['유성구', '카이스트'] });
    // 대전광역시 유성구 행정동
    addLocation({ lat: 36.29685, lon: 127.318599999999, name: '대전광역시 유성구 진잠동', type: '행정동', admin_parent: '대전광역시 유성구', legal_divisions: ['원내동', '교촌동', '대정동', '용계동', '학하동', '계산동', '성북동', '세동', '송정동', '방동', '봉곡동', '덕명동', '복용동', '구룡동'] });
    addLocation({ lat: 36.3411396869139, lon: 127.30872977332, name: '대전광역시 유성구 학하동', type: '행정동', admin_parent: '대전광역시 유성구', legal_divisions: ['학하동', '덕명동', '복용동', '구룡동'] });
    addLocation({ lat: 36.346794528901, lon: 127.334691269024, name: '대전광역시 유성구 상대동', type: '행정동', admin_parent: '대전광역시 유성구', legal_divisions: ['상대동', '하대동'] });
    addLocation({ lat: 36.3502555555555, lon: 127.341111111111, name: '대전광역시 유성구 온천1동', type: '행정동', admin_parent: '대전광역시 유성구', legal_divisions: ['봉명동', '구암동', '장대동'] });
    addLocation({ lat: 36.3572277777777, lon: 127.339041666666, name: '대전광역시 유성구 온천2동', type: '행정동', admin_parent: '대전광역시 유성구', legal_divisions: ['궁동', '어은동', '구성동'] });
    addLocation({ lat: 36.3653305555555, lon: 127.320555555555, name: '대전광역시 유성구 노은1동', type: '행정동', admin_parent: '대전광역시 유성구', legal_divisions: ['노은동', '지족동'] });
    addLocation({ lat: 36.3885805555555, lon: 127.313911111111, name: '대전광역시 유성구 노은2동', type: '행정동', admin_parent: '대전광역시 유성구', legal_divisions: ['지족동', '반석동'] });
    addLocation({ lat: 36.386791, lon: 127.307896, name: '대전광역시 유성구 노은3동', type: '행정동', admin_parent: '대전광역시 유성구', legal_divisions: ['하기동', '학하동'] });
    addLocation({ lat: 36.38625, lon: 127.349533333333, name: '대전광역시 유성구 신성동', type: '행정동', admin_parent: '대전광역시 유성구', legal_divisions: ['신성동', '가정동', '장동', '죽동', '자운대동', '추목동', '방현동', '화암동', '덕진동', '하기동'] });
    addLocation({ lat: 36.3970277777777, lon: 127.402530555555, name: '대전광역시 유성구 전민동', type: '행정동', admin_parent: '대전광역시 유성구', legal_divisions: ['전민동', '문지동', '원촌동'] });
    addLocation({ lat: 36.4374694444444, lon: 127.385922222222, name: '대전광역시 유성구 구즉동', type: '행정동', admin_parent: '대전광역시 유성구', legal_divisions: ['구즉동', '봉산동', '송강동', '금고동', '대동'] });
    addLocation({ lat: 36.42316994, lon: 127.3887774, name: '대전광역시 유성구 관평동', type: '행정동', admin_parent: '대전광역시 유성구', legal_divisions: ['관평동', '용산동', '탑립동'] });
    addLocation({ lat: 36.342146, lon: 127.343296, name: '대전광역시 유성구 원신흥동', type: '행정동', admin_parent: '대전광역시 유성구', legal_divisions: ['원신흥동', '상대동', '도안동', '봉명동'] });

    // =============================================================
    // 대전광역시 대덕구 (기초자치단체)
    addLocation({ name: '대전광역시 대덕구', type: '기초자치단체', admin_parent: '대전광역시', aliases: ['대덕구'] });
    // 대전광역시 대덕구 행정동
    addLocation({ lat: 36.3508333333333, lon: 127.411975, name: '대전광역시 대덕구 오정동', type: '행정동', admin_parent: '대전광역시 대덕구', legal_divisions: ['오정동'] });
    addLocation({ lat: 36.36345, lon: 127.413463888888, name: '대전광역시 대덕구 대화동', type: '행정동', admin_parent: '대전광역시 대덕구', legal_divisions: ['대화동'] });
    addLocation({ lat: 36.3733333333333, lon: 127.4236, name: '대전광역시 대덕구 회덕동', type: '행정동', admin_parent: '대전광역시 대덕구', legal_divisions: ['회덕동', '와동', '읍내동', '신대동', '연축동', '이현동', '장동', '탑립동', '관평동', '문평동', '신일동', '구즉동', '전민동', '용호동', '부수동', '황호동', '삼정동', '미호동'] });
    addLocation({ lat: 36.3520138888888, lon: 127.452022222222, name: '대전광역시 대덕구 비래동', type: '행정동', admin_parent: '대전광역시 대덕구', legal_divisions: ['비래동', '법동'] });
    addLocation({ lat: 36.3627222222222, lon: 127.442033333333, name: '대전광역시 대덕구 송촌동', type: '행정동', admin_parent: '대전광역시 대덕구', legal_divisions: ['송촌동'] });
    addLocation({ lat: 36.3577222222222, lon: 127.428552777777, name: '대전광역시 대덕구 중리동', type: '행정동', admin_parent: '대전광역시 대덕구', legal_divisions: ['중리동'] });
    addLocation({ lat: 36.4487888888888, lon: 127.431208333333, name: '대전광역시 대덕구 신탄진동', type: '행정동', admin_parent: '대전광역시 대덕구', legal_divisions: ['신탄진동', '석봉동', '덕암동', '목상동', '상서동', '평촌동'] });
    addLocation({ lat: 36.4451944444444, lon: 127.427875, name: '대전광역시 대덕구 석봉동', type: '행정동', admin_parent: '대전광역시 대덕구', legal_divisions: ['석봉동'] });
    addLocation({ lat: 36.4373444444444, lon: 127.429075, name: '대전광역시 대덕구 덕암동', type: '행정동', admin_parent: '대전광역시 대덕구', legal_divisions: ['덕암동'] });
    addLocation({ lat: 36.445575, lon: 127.414330555555, name: '대전광역시 대덕구 목상동', type: '행정동', admin_parent: '대전광역시 대덕구', legal_divisions: ['목상동'] });
    addLocation({ lat: 36.3679055555555, lon: 127.428897222222, name: '대전광역시 대덕구 법1동', type: '행정동', admin_parent: '대전광역시 대덕구', legal_divisions: ['법동'] });
    addLocation({ lat: 36.3643194444444, lon: 127.432908333333, name: '대전광역시 대덕구 법2동', type: '행정동', admin_parent: '대전광역시 대덕구', legal_divisions: ['법동'] });


// 울산광역시 (광역시)
addLocation('울산광역시', {lat: 35.5354083333333, lon: 129.313688888888, name: '울산광역시', type: '광역시', admin_parent: '', legal_divisions: [], aliases: [], priority_score: priorityMap['울산광역시']});

// 울산광역시 중구 (기초자치단체)
addLocation('중구', {lat: 35.5663416666666, lon: 129.334875, name: '울산광역시 중구', type: '기초자치단체', admin_parent: '울산광역시', legal_divisions: [], aliases: [], priority_score: priorityMap['중구']});
// 울산광역시 중구 행정동
addLocation('학성동', {lat: 35.5523194444444, lon: 129.336986111111, name: '울산광역시 중구 학성동', type: '행정동', admin_parent: '울산광역시 중구', legal_divisions: ['학성동'], aliases: [], priority_score: priorityMap['학성동']});
addLocation('반구1동', {lat: 35.5533861111111, lon: 129.343911111111, name: '울산광역시 중구 반구1동', type: '행정동', admin_parent: '울산광역시 중구', legal_divisions: ['반구동'], aliases: [], priority_score: priorityMap['반구1동']});
addLocation('반구2동', {lat: 35.5603055555555, lon: 129.343097222222, name: '울산광역시 중구 반구2동', type: '행정동', admin_parent: '울산광역시 중구', legal_divisions: ['반구동'], aliases: [], priority_score: priorityMap['반구2동']});
addLocation('복산동', {lat: 35.56579338, lon: 129.3342518, name: '울산광역시 중구 복산동', type: '행정동', admin_parent: '울산광역시 중구', legal_divisions: ['복산동'], aliases: [], priority_score: priorityMap['복산동']});
addLocation('중앙동', {lat: 35.557542, lon: 129.32405, name: '울산광역시 중구 중앙동', type: '행정동', admin_parent: '울산광역시 중구', legal_divisions: ['중앙동'], aliases: [], priority_score: priorityMap['중앙동']});
addLocation('우정동', {lat: 35.5517361111111, lon: 129.314641666666, name: '울산광역시 중구 우정동', type: '행정동', admin_parent: '울산광역시 중구', legal_divisions: ['우정동'], aliases: [], priority_score: priorityMap['우정동']});
addLocation('태화동', {lat: 35.5535166666666, lon: 129.306730555555, name: '울산광역시 중구 태화동', type: '행정동', admin_parent: '울산광역시 중구', legal_divisions: ['태화동'], aliases: [], priority_score: priorityMap['태화동']});
addLocation('다운동', {lat: 35.5533, lon: 129.277988888888, name: '울산광역시 중구 다운동', type: '행정동', admin_parent: '울산광역시 중구', legal_divisions: ['다운동'], aliases: [], priority_score: priorityMap['다운동']});
addLocation('병영1동', {lat: 35.5670111111111, lon: 129.348855555555, name: '울산광역시 중구 병영1동', type: '행정동', admin_parent: '울산광역시 중구', legal_divisions: ['병영동'], aliases: [], priority_score: priorityMap['병영1동']});
addLocation('병영2동', {lat: 35.57635, lon: 129.348275, name: '울산광역시 중구 병영2동', type: '행정동', admin_parent: '울산광역시 중구', legal_divisions: ['병영동'], aliases: [], priority_score: priorityMap['병영2동']});
addLocation('약사동', {lat: 35.5673916666666, lon: 129.339541666666, name: '울산광역시 중구 약사동', type: '행정동', admin_parent: '울산광역시 중구', legal_divisions: ['약사동'], aliases: [], priority_score: priorityMap['약사동']});
addLocation('성안동', {lat: 35.5743416666667, lon: 129.309697222222, name: '울산광역시 중구 성안동', type: '행정동', admin_parent: '울산광역시 중구', legal_divisions: ['성안동'], aliases: [], priority_score: priorityMap['성안동']});

// 울산광역시 남구 (기초자치단체)
addLocation('남구', {lat: 35.5407638888888, lon: 129.332386111111, name: '울산광역시 남구', type: '기초자치단체', admin_parent: '울산광역시', legal_divisions: [], aliases: ['울산대공원'], priority_score: priorityMap['남구']});
// 울산광역시 남구 행정동
addLocation('신정1동', {lat: 35.5382916666666, lon: 129.308844444444, name: '울산광역시 남구 신정1동', type: '행정동', admin_parent: '울산광역시 남구', legal_divisions: ['신정동'], aliases: [], priority_score: priorityMap['신정1동']});
addLocation('신정2동', {lat: 35.5316111111111, lon: 129.310177777777, name: '울산광역시 남구 신정2동', type: '행정동', admin_parent: '울산광역시 남구', legal_divisions: ['신정동'], aliases: [], priority_score: priorityMap['신정2동']});
addLocation('신정3동', {lat: 35.5419666666666, lon: 129.318722222222, name: '울산광역시 남구 신정3동', type: '행정동', admin_parent: '울산광역시 남구', legal_divisions: ['신정동'], aliases: [], priority_score: priorityMap['신정3동']});
addLocation('신정4동', {lat: 35.5262805555555, lon: 129.316777777777, name: '울산광역시 남구 신정4동', type: '행정동', admin_parent: '울산광역시 남구', legal_divisions: ['신정동'], aliases: [], priority_score: priorityMap['신정4동']});
addLocation('신정5동', {lat: 35.54185, lon: 129.323722222222, name: '울산광역시 남구 신정5동', type: '행정동', admin_parent: '울산광역시 남구', legal_divisions: ['신정동'], aliases: [], priority_score: priorityMap['신정5동']});
addLocation('달동', {lat: 35.5333944444444, lon: 129.318844444444, name: '울산광역시 남구 달동', type: '행정동', admin_parent: '울산광역시 남구', legal_divisions: ['달동'], aliases: [], priority_score: priorityMap['달동']});
addLocation('삼산동', {lat: 35.5413888888888, lon: 129.334155555555, name: '울산광역시 남구 삼산동', type: '행정동', admin_parent: '울산광역시 남구', legal_divisions: ['삼산동'], aliases: [], priority_score: priorityMap['삼산동']});
addLocation('삼호동', {lat: 35.5469444444444, lon: 129.268275, name: '울산광역시 남구 삼호동', type: '행정동', admin_parent: '울산광역시 남구', legal_divisions: ['삼호동'], aliases: [], priority_score: priorityMap['삼ho동']});
addLocation('무거동', {lat: 35.5479222222222, lon: 129.263011111111, name: '울산광역시 남구 무거동', type: '행정동', admin_parent: '울산광역시 남구', legal_divisions: ['무거동'], aliases: [], priority_score: priorityMap['무거동']});
addLocation('옥동', {lat: 35.5322444444444, lon: 129.296166666666, name: '울산광역시 남구 옥동', type: '행정동', admin_parent: '울산광역시 남구', legal_divisions: ['옥동'], aliases: [], priority_score: priorityMap['옥동']});
addLocation('대현동', {lat: 35.5235083333333, lon: 129.329122222222, name: '울산광역시 남구 대현동', type: '행정동', admin_parent: '울산광역시 남구', legal_divisions: ['대현동'], aliases: [], priority_score: priorityMap['대현동']});
addLocation('수암동', {lat: 35.5213583333333, lon: 129.320666666666, name: '울산광역시 남구 수암동', type: '행정동', admin_parent: '울산광역시 남구', legal_divisions: ['수암동'], aliases: [], priority_score: priorityMap['수암동']});
addLocation('선암동', {lat: 35.5098611111111, lon: 129.3375, name: '울산광역시 남구 선암동', type: '행정동', admin_parent: '울산광역시 남구', legal_divisions: ['선암동'], aliases: [], priority_score: priorityMap['선암동']});
addLocation('야음장생포동', {lat: 35.5165805555555, lon: 129.341275, name: '울산광역시 남구 야음장생포동', type: '행정동', admin_parent: '울산광역시 남구', legal_divisions: ['야음동, 장생포동, 매암동, 황성동, 부곡동, 용연동, 용잠동, 고사동, 성암동, 황성동, 상개동, 개운동'], aliases: [], priority_score: priorityMap['야음장생포동']});

// 울산광역시 동구 (기초자치단체)
addLocation('동구', {lat: 35.5018888888888, lon: 129.418952777777, name: '울산광역시 동구', type: '기초자치단체', admin_parent: '울산광역시', legal_divisions: [], aliases: [], priority_score: priorityMap['동구']});
// 울산광역시 동구 행정동
addLocation('방어동', {lat: 35.482975, lon: 129.426411111111, name: '울산광역시 동구 방어동', type: '행정동', admin_parent: '울산광역시 동구', legal_divisions: ['방어동'], aliases: [], priority_score: priorityMap['방어동']});
addLocation('일산동', {lat: 35.4950305555555, lon: 129.428544444444, name: '울산광역시 동구 일산동', type: '행정동', admin_parent: '울산광역시 동구', legal_divisions: ['일산동'], aliases: [], priority_score: priorityMap['일산동']});
addLocation('화정동', {lat: 35.4907, lon: 129.426863888888, name: '울산광역시 동구 화정동', type: '행정동', admin_parent: '울산광역시 동구', legal_divisions: ['화정동'], aliases: [], priority_score: priorityMap['화정동']});
addLocation('대송동', {lat: 35.5001361111111, lon: 129.420644444444, name: '울산광역시 동구 대송동', type: '행정동', admin_parent: '울산광역시 동구', legal_divisions: ['대송동'], aliases: [], priority_score: priorityMap['대송동']});
addLocation('전하1동', {lat: 35.5137583333333, lon: 129.430875, name: '울산광역시 동구 전하1동', type: '행정동', admin_parent: '울산광역시 동구', legal_divisions: ['전하동'], aliases: [], priority_score: priorityMap['전하1동']});
addLocation('전하2동', {lat: 35.5063027777777, lon: 129.431574999999, name: '울산광역시 동구 전하2동', type: '행정동', admin_parent: '울산광역시 동구', legal_divisions: ['전하동'], aliases: [], priority_score: priorityMap['전하2동']});
addLocation('남목1동', {lat: 35.5363416666666, lon: 129.423133333333, name: '울산광역시 동구 남목1동', type: '행정동', admin_parent: '울산광역시 동구', legal_divisions: ['남목동'], aliases: [], priority_score: priorityMap['남목1동']});
addLocation('남목2동', {lat: 35.5215638888888, lon: 129.433888888888, name: '울산광역시 동구 남목2동', type: '행정동', admin_parent: '울산광역시 동구', legal_divisions: ['남목동'], aliases: [], priority_score: priorityMap['남목2동']});
addLocation('남목3동', {lat: 35.5429444444444, lon: 129.433633333333, name: '울산광역시 동구 남목3동', type: '행정동', admin_parent: '울산광역시 동구', legal_divisions: ['남목동'], aliases: [], priority_score: priorityMap['남목3동']});

// 울산광역시 북구 (기초자치단체)
addLocation('북구', {lat: 35.5796888888888, lon: 129.363544444444, name: '울산광역시 북구', type: '기초자치단체', admin_parent: '울산광역시', legal_divisions: [], aliases: [], priority_score: priorityMap['북구']});
// 울산광역시 북구 행정동
addLocation('농소1동', {lat: 35.6197527777777, lon: 129.358333333333, name: '울산광역시 북구 농소1동', type: '행정동', admin_parent: '울산광역시 북구', legal_divisions: ['농소동'], aliases: [], priority_score: priorityMap['농소1동']});
addLocation('농소2동', {lat: 35.6352388888888, lon: 129.350475, name: '울산광역시 북구 농소2동', type: '행정동', admin_parent: '울산광역시 북구', legal_divisions: ['농소동'], aliases: [], priority_score: priorityMap['농소2동']});
addLocation('농소3동', {lat: 35.6256333333333, lon: 129.341933333333, name: '울산광역시 북구 농소3동', type: '행정동', admin_parent: '울산광역시 북구', legal_divisions: ['농소동'], aliases: [], priority_score: priorityMap['농소3동']});
addLocation('강동동', {lat: 35.6124055555555, lon: 129.450652777777, name: '울산광역시 북구 강동동', type: '행정동', admin_parent: '울산광역시 북구', legal_divisions: ['강동동'], aliases: [], priority_score: priorityMap['강동동']});
addLocation('효문동', {lat: 35.5747916666666, lon: 129.363397222222, name: '울산광역시 북구 효문동', type: '행정동', admin_parent: '울산광역시 북구', legal_divisions: ['효문동'], aliases: [], priority_score: priorityMap['효문동']});
addLocation('송정동', {lat: 35.591775, lon: 129.359811111111, name: '울산광역시 북구 송정동', type: '행정동', admin_parent: '울산광역시 북구', legal_divisions: ['송정동'], aliases: [], priority_score: priorityMap['송정동']});
addLocation('양정동', {lat: 35.5429361111111, lon: 129.387808333333, name: '울산광역시 북구 양정동', type: '행정동', admin_parent: '울산광역시 북구', legal_divisions: ['양정동'], aliases: [], priority_score: priorityMap['양정동']});
addLocation('염포동', {lat: 35.5238194444444, lon: 129.401397222222, name: '울산광역시 북구 염포동', type: '행정동', admin_parent: '울산광역시 북구', legal_divisions: ['염포동'], aliases: [], priority_score: priorityMap['염포동']});

// 울산광역시 울주군 (기초자치단체)
addLocation('울주군', {lat: 35.5307388888888, lon: 129.297163888888, name: '울산광역시 울주군', type: '기초자치단체', admin_parent: '울산광역시', legal_divisions: [], aliases: [], priority_score: priorityMap['울주군']});
// 울산광역시 울주군 읍·면
addLocation('온산읍', {lat: 35.4315805555555, lon: 129.316863888888, name: '울산광역시 울주군 온산읍', type: '읍', admin_parent: '울산광역시 울주군', legal_divisions: ['방도리, 온산리, 덕신리, 강양리, 용당리, 화산리, 삼평리, 원산리, 이진리, 목도리, 산암리'], aliases: [], priority_score: priorityMap['온산읍']});
addLocation('언양읍', {lat: 35.5663722222222, lon: 129.128044444444, name: '울산광역시 울주군 언양읍', type: '읍', admin_parent: '울산광역시 울주군', legal_divisions: ['남부리, 동부리, 서부리, 어음리, 반곡리, 구수리, 대곡리, 태화리, 반연리, 평리, 직동리, 고연리'], aliases: [], priority_score: priorityMap['언양읍']});
addLocation('온양읍', {lat: 35.4159027777777, lon: 129.283055555555, name: '울산광역시 울주군 온양읍', type: '읍', admin_parent: '울산광역시 울주군', legal_divisions: ['남창리, 외광리, 발리, 운화리, 대안리, 고산리, 동상리, 내광리, 웅촌리'], aliases: [], priority_score: priorityMap['온양읍']});
addLocation('범서읍', {lat: 35.5659027777777, lon: 129.232419444444, name: '울산광역시 울주군 범서읍', type: '읍', admin_parent: '울산광역시 울주군', legal_divisions: ['구영리, 천상리, 굴화리, 입암리, 무거동, 사연리, 척과리, 선바위리, 서사리, 중리, 두산리, 점촌리, 망성리, 길촌리, 대리'], aliases: [], priority_score: priorityMap['범서읍']});
addLocation('청량읍', {lat: 35.49313, lon: 129.306002, name: '울산광역시 울주군 청량읍', type: '읍', admin_parent: '울산광역시 울주군', legal_divisions: ['율리, 문수리, 상남리, 중남리, 하남리, 용암리, 온산리, 덕하리, 동천리'], aliases: [], priority_score: priorityMap['청량읍']});
addLocation('삼남읍', {lat: 35.5388225, lon: 129.1065147, name: '울산광역시 울주군 삼남읍', type: '읍', admin_parent: '울산광역시 울주군', legal_divisions: ['교동리, 상천리, 하천리, 가천리, 방기리, 수남리'], aliases: [], priority_score: priorityMap['삼남읍']});
addLocation('서생면', {lat: 35.3461722222222, lon: 129.328566666666, name: '울산광역시 울주군 서생면', type: '면', admin_parent: '울산광역시 울주군', legal_divisions: ['신암리, 위곡리, 대송리, 명산리, 화산리, 용리, 평동리, 나사리, 서생리, 진하리'], aliases: [], priority_score: priorityMap['서생면']});
addLocation('웅촌면', {lat: 35.4631305555555, lon: 129.211844444444, name: '울산광역시 울주군 웅촌면', 'type': '면', admin_parent: '울산광역시 울주군', legal_divisions: ['곡천리, 대복리, 검단리, 고연리, 은현리, 석천리, 회야리, 통천리, 대대리'], aliases: [], priority_score: priorityMap['웅촌면']});
addLocation('두동면', {lat: 35.6512166666666, lon: 129.203530555555, name: '울산광역시 울주군 두동면', type: '면', admin_parent: '울산광역시 울주군', legal_divisions: ['천전리, 구미리, 은편리, 봉계리, 이하리, 월평리, 만화리, 신화리'], aliases: [], priority_score: priorityMap['두동면']});
addLocation('두서면', {lat: 35.6404305555555, lon: 129.1612, name: '울산광역시 울주군 두서면', type: '면', admin_parent: '울산광역시 울주군', legal_divisions: ['인보리, 활천리, 전읍리, 미호리, 복안리, 서하리, 내와리, 차리'], aliases: [], priority_score: priorityMap['두서면']});
addLocation('상북면', {lat: 35.5875611111111, lon: 129.093463888888, name: '울산광역시 울주군 상북면', type: '면', admin_parent: '울산광역시 울주군', legal_divisions: ['산전리, 향산리, 천전리, 길천리, 이천리, 소호리, 궁근정리, 덕현리'], aliases: [], priority_score: priorityMap['상북면']});
addLocation('삼동면', {lat: 35.5190861111111, lon: 129.159155555555, name: '울산광역시 울주군 삼동면', type: '면', admin_parent: '울산광역시 울주군', legal_divisions: ['하잠리, 금곡리, 보삼리, 조일리'], aliases: [], priority_score: priorityMap['삼동면']});





    // =============================================================
    // 인천광역시 (광역자치단체)
    addLocation({ name: '인천광역시', lat: 37.4532333333333, lon: 126.707352777777, type: '광역자치단체', aliases: ['인천', '인천시'] });

    // =============================================================
    // 인천 10개 구/군 및 하위 행정동/읍/면 데이터

    // 중구 및 하위 동
    addLocation({ name: '인천광역시 중구', lat: 37.4709333333333, lon: 126.623566666666, type: '기초자치단체', admin_parent: '인천광역시' });
    addLocation({ name: '인천광역시 중구 연안동', lat: 37.4504194444444, lon: 126.6066, type: '행정동', admin_parent: '인천광역시 중구', legal_divisions: ['연안동', '항동', '신흥동3가'] });
    addLocation({ name: '인천광역시 중구 신포동', lat: 37.4675555555555, lon: 126.627155555555, type: '행정동', admin_parent: '인천광역시 중구', legal_divisions: ['신포동', '중앙동', '해안동', '관동', '송학동', '사동', '신생동', '답동', '선린동', '내동', '경동', '용동', '인현동', '전동', '내항동'] });
    addLocation({ name: '인천광역시 중구 신흥동', lat: 37.4648722222222, lon: 126.636152777777, type: '행정동', admin_parent: '인천광역시 중구', legal_divisions: ['신흥동1가', '신흥동2가', '신흥동3가', '선화동', '유동', '율목동', '도원동'] });
    addLocation({ name: '인천광역시 중구 도원동', lat: 37.4653055555555, lon: 126.639975, type: '행정동', admin_parent: '인천광역시 중구', legal_divisions: ['도원동'] });
    addLocation({ name: '인천광역시 중구 율목동', lat: 37.4664611111111, lon: 126.637955555555, type: '행정동', admin_parent: '인천광역시 중구', legal_divisions: ['율목동', '유동'] });
    addLocation({ name: '인천광역시 중구 동인천동', lat: 37.4740472222222, lon: 126.631111111111, type: '행정동', admin_parent: '인천광역시 중구', legal_divisions: ['인현동', '전동', '내동', '경동', '신생동', '답동', '선린동', '북성동1가', '북성동2가', '북성동3가', '송월동1가', '송월동2가', '송월동3가'] });
    addLocation({ name: '인천광역시 중구 개항동', lat: 37.4725555555555, lon: 126.620686111111, type: '행정동', admin_parent: '인천광역시 중구', legal_divisions: ['항동1가', '항동2가', '항동3가', '항동4가', '항동5가', '항동6가', '항동7가', '관동1가', '관동2가', '관동3가', '송학동1가', '송학동2가', '송학동3가', '신포동', '중앙동1가', '중앙동2가', '중앙동3가', '해안동1가', '해안동2가', '해안동3가', '해안동4가', '선린동'] });
    addLocation({ name: '인천광역시 중구 영종동', lat: 37.4907472222222, lon: 126.532997222222, type: '행정동', admin_parent: '인천광역시 중구', legal_divisions: ['운남동', '운북동', '중산동'] });
    addLocation({ name: '인천광역시 중구 영종1동', lat: 37.489325, lon: 126.554234, type: '행정동', admin_parent: '인천광역시 중구', legal_divisions: ['운남동', '운북동', '중산동'] });
    addLocation({ name: '인천광역시 중구 영종2동', lat: 37.49928373, lon: 126.5687266, type: '행정동', admin_parent: '인천광역시 중구', legal_divisions: ['운남동', '운북동', '중산동'] });
    addLocation({ name: '인천광역시 중구 운서동', lat: 37.49339138, lon: 126.4884015, type: '행정동', admin_parent: '인천광역시 중구', legal_divisions: ['운서동', '공항동'] });
    addLocation({ name: '인천광역시 중구 용유동', lat: 37.4410694444444, lon: 126.404475, type: '행정동', admin_parent: '인천광역시 중구', legal_divisions: ['을왕동', '남북동', '덕교동', '마시안동', '선녀바위동', '용유동'] });
    addLocation({ name: '인천광역시 중구 영종출장소', lat: 37.4907472222222, lon: 126.532997222222, type: '별칭', admin_parent: '인천광역시 중구', aliases: ['영종도'] });
    addLocation({ name: '인천광역시 중구 인천국제공항', lat: 37.469223, lon: 126.450534, type: '별칭', admin_parent: '인천광역시 중구', aliases: ['인천공항', 'ICN'] });
    addLocation({ name: '인천광역시 중구 월미도', lat: 37.4700, lon: 126.6000, type: '별칭', admin_parent: '인천광역시 중구' });
    addLocation({ name: '인천광역시 중구 을왕리', lat: 37.4650, lon: 126.3400, type: '별칭', admin_parent: '인천광역시 중구' });

    // 동구 및 하위 동
    addLocation({ name: '인천광역시 동구', lat: 37.4710361111111, lon: 126.645366666666, type: '기초자치단체', admin_parent: '인천광역시' });
    addLocation({ name: '인천광역시 동구 만석동', lat: 37.4804444444444, lon: 126.627530555555, type: '행정동', admin_parent: '인천광역시 동구', legal_divisions: ['만석동'] });
    addLocation({ name: '인천광역시 동구 화수1.화평동', lat: 37.4787361111111, lon: 126.631952777777, type: '행정동', admin_parent: '인천광역시 동구', legal_divisions: ['화수동', '화평동'] });
    addLocation({ name: '인천광역시 동구 화수2동', lat: 37.4815805555555, lon: 126.632222222222, type: '행정동', admin_parent: '인천광역시 동구', legal_divisions: ['화수동'] });
    addLocation({ name: '인천광역시 동구 송현1.2동', lat: 37.4733638888888, lon: 126.639188888888, type: '행정동', admin_parent: '인천광역시 동구', legal_divisions: ['송현동'] });
    addLocation({ name: '인천광역시 동구 송현3동', lat: 37.4795166666666, lon: 126.644722222222, type: '행정동', admin_parent: '인천광역시 동구', legal_divisions: ['송현동'] });
    addLocation({ name: '인천광역시 동구 송림1동', lat: 37.4734833333333, lon: 126.642333333333, type: '행정동', admin_parent: '인천광역시 동구', legal_divisions: ['송림동'] });
    addLocation({ name: '인천광역시 동구 송림2동', lat: 37.473025, lon: 126.644730555555, type: '행정동', admin_parent: '인천광역시 동구', legal_divisions: ['송림동'] });
    addLocation({ name: '인천광역시 동구 송림3.5동', lat: 37.4701166666666, lon: 126.6486, type: '행정동', admin_parent: '인천광역시 동구', legal_divisions: ['송림동'] });
    addLocation({ name: '인천광역시 동구 송림4동', lat: 37.4754611111111, lon: 126.652022222222, type: '행정동', admin_parent: '인천광역시 동구', legal_divisions: ['송림동'] });
    addLocation({ name: '인천광역시 동구 송림6동', lat: 37.4745527777777, lon: 126.650030555555, type: '행정동', admin_parent: '인천광역시 동구', legal_divisions: ['송림동'] });
    addLocation({ name: '인천광역시 동구 금창동', lat: 37.4697777777777, lon: 126.641944444444, type: '행정동', admin_parent: '인천광역시 동구', legal_divisions: ['금곡동', '창영동'] });

    // 미추홀구 및 하위 동
    addLocation({ name: '인천광역시 미추홀구', lat: 37.4606805555555, lon: 126.652686111111, type: '기초자치단체', admin_parent: '인천광역시' });
    addLocation({ name: '인천광역시 미추홀구 숭의2동', lat: 37.4602527777777, lon: 126.649311111111, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['숭의동'] });
    addLocation({ name: '인천광역시 미추홀구 숭의1.3동', lat: 37.4672428, lon: 126.6471814, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['숭의동'] });
    addLocation({ name: '인천광역시 미추홀구 숭의4동', lat: 37.4620444444444, lon: 126.661241666666, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['숭의동'] });
    addLocation({ name: '인천광역시 미추홀구 용현1.4동', lat: 37.4562382, lon: 126.6599204, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['용현동'] });
    addLocation({ name: '인천광역시 미추홀구 용현2동', lat: 37.4523222222222, lon: 126.647530555555, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['용현동'] });
    addLocation({ name: '인천광역시 미추홀구 용현3동', lat: 37.4539083333333, lon: 126.653966666666, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['용현동'] });
    addLocation({ name: '인천광역시 미추홀구 용현5동', lat: 37.4497138888888, lon: 126.642419444444, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['용현동'] });
    addLocation({ name: '인천광역시 미추홀구 학익1동', lat: 37.4370833333333, lon: 126.666233333333, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['학익동'] });
    addLocation({ name: '인천광역시 미추홀구 학익2동', lat: 37.4437694444444, lon: 126.669508333333, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['학익동'] });
    addLocation({ name: '인천광역시 미추홀구 도화1동', lat: 37.4581, lon: 126.675897222222, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['도화동'] });
    addLocation({ name: '인천광역시 미추홀구 도화2.3동', lat: 37.4675264, lon: 126.6647547, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['도화동'] });
    addLocation({ name: '인천광역시 미추홀구 주안1동', lat: 37.4609833333333, lon: 126.6787, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['주안동'] });
    addLocation({ name: '인천광역시 미추홀구 주안2동', lat: 37.4519138888888, lon: 126.674752777777, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['주안동'] });
    addLocation({ name: '인천광역시 미추홀구 주안3동', lat: 37.4420861111111, lon: 126.676111111111, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['주안동'] });
    addLocation({ name: '인천광역시 미추홀구 주안4동', lat: 37.4522944444444, lon: 126.692366666666, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['주안동'] });
    addLocation({ name: '인천광역시 미추홀구 주안5동', lat: 37.4630694444444, lon: 126.689108333333, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['주안동'] });
    addLocation({ name: '인천광역시 미추홀구 주안6동', lat: 37.4596583333333, lon: 126.6915, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['주안동'] });
    addLocation({ name: '인천광역시 미추홀구 주안7동', lat: 37.4456444444444, lon: 126.679711111111, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['주안동'] });
    addLocation({ name: '인천광역시 미추홀구 주안8동', lat: 37.446825, lon: 126.691419444444, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['주안동'] });
    addLocation({ name: '인천광역시 미추홀구 관교동', lat: 37.4414166666666, lon: 126.698911111111, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['관교동'] });
    addLocation({ name: '인천광역시 미추홀구 문학동', lat: 37.4348805555555, lon: 126.687097222222, type: '행정동', admin_parent: '인천광역시 미추홀구', legal_divisions: ['문학동'] });

    // 연수구 및 하위 동
    addLocation({ name: '인천광역시 연수구', lat: 37.4071222222222, lon: 126.680441666666, type: '기초자치단체', admin_parent: '인천광역시' });
    addLocation({ name: '인천광역시 연수구 옥련1동', lat: 37.4245333333333, lon: 126.657141666666, type: '행정동', admin_parent: '인천광역시 연수구', legal_divisions: ['옥련동'] });
    addLocation({ name: '인천광역시 연수구 옥련2동', lat: 37.4235, lon: 126.650286111111, type: '행정동', admin_parent: '인천광역시 연수구', legal_divisions: ['옥련동'] });
    addLocation({ name: '인천광역시 연수구 선학동', lat: 37.4196916666666, lon: 126.703430555555, type: '행정동', admin_parent: '인천광역시 연수구', legal_divisions: ['선학동'] });
    addLocation({ name: '인천광역시 연수구 연수1동', lat: 37.4193805555555, lon: 126.683708333333, type: '행정동', admin_parent: '인천광역시 연수구', legal_divisions: ['연수동'] });
    addLocation({ name: '인천광역시 연수구 연수2동', lat: 37.4088722222222, lon: 126.683977777777, type: '행정동', admin_parent: '인천광역시 연수구', legal_divisions: ['연수동'] });
    addLocation({ name: '인천광역시 연수구 연수3동', lat: 37.4165999999999, lon: 126.694155555555, type: '행정동', admin_parent: '인천광역시 연수구', legal_divisions: ['연수동'] });
    addLocation({ name: '인천광역시 연수구 청학동', lat: 37.4222, lon: 126.668219444444, type: '행정동', admin_parent: '인천광역시 연수구', legal_divisions: ['청학동'] });
    addLocation({ name: '인천광역시 연수구 동춘1동', lat: 37.40685, lon: 126.672908333333, type: '행정동', admin_parent: '인천광역시 연수구', legal_divisions: ['동춘동'] });
    addLocation({ name: '인천광역시 연수구 동춘2동', lat: 37.3999166666666, lon: 126.671363888888, type: '행정동', admin_parent: '인천광역시 연수구', legal_divisions: ['동춘동'] });
    addLocation({ name: '인천광역시 연수구 동춘3동', lat: 37.405625, lon: 126.680366666666, type: '행정동', admin_parent: '인천광역시 연수구', legal_divisions: ['동춘동'] });
    addLocation({ name: '인천광역시 연수구 송도1동', lat: 37.39105764, lon: 126.652082, type: '행정동', admin_parent: '인천광역시 연수구', legal_divisions: ['송도동'], aliases: ['송도'] });
    addLocation({ name: '인천광역시 연수구 송도2동', lat: 37.40328, lon: 126.641639, type: '행정동', admin_parent: '인천광역시 연수구', legal_divisions: ['송도동'] });
    addLocation({ name: '인천광역시 연수구 송도3동', lat: 37.3816722222222, lon: 126.663366666667, type: '행정동', admin_parent: '인천광역시 연수구', legal_divisions: ['송도동'] });
    addLocation({ name: '인천광역시 연수구 송도4동', lat: 37.388109, lon: 126.634928, type: '행정동', admin_parent: '인천광역시 연수구', legal_divisions: ['송도동'] });
    addLocation({ name: '인천광역시 연수구 송도5동', lat: 37.413941, lon: 126.623231, type: '행정동', admin_parent: '인천광역시 연수구', legal_divisions: ['송도동'] });

    // 남동구 및 하위 동
    addLocation({ name: '인천광역시 남동구', lat: 37.4445194444444, lon: 126.733797222222, type: '기초자치단체', admin_parent: '인천광역시' });
    addLocation({ name: '인천광역시 남동구 구월1동', lat: 37.4496027777777, lon: 126.713675, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['구월동'] });
    addLocation({ name: '인천광역시 남동구 구월2동', lat: 37.4532638888888, lon: 126.715422222222, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['구월동'] });
    addLocation({ name: '인천광역시 남동구 구월3동', lat: 37.4499083333333, lon: 126.699033333333, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['구월동'] });
    addLocation({ name: '인천광역시 남동구 구월4동', lat: 37.4468055555555, lon: 126.726208333333, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['구월동'] });
    addLocation({ name: '인천광역시 남동구 간석1동', lat: 37.4558277777777, lon: 126.707366666666, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['간석동'] });
    addLocation({ name: '인천광역시 남동구 간석2동', lat: 37.4589, lon: 126.711066666666, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['간석동'] });
    addLocation({ name: '인천광역시 남동구 간석3동', lat: 37.4633638888888, lon: 126.7166, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['간석동'] });
    addLocation({ name: '인천광역시 남동구 간석4동', lat: 37.4637888888888, lon: 126.7028, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['간석동'] });
    addLocation({ name: '인천광역시 남동구 만수1동', lat: 37.4459944444444, lon: 126.734133333333, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['만수동'] });
    addLocation({ name: '인천광역시 남동구 만수2동', lat: 37.4564166666666, lon: 126.732922222222, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['만수동'] });
    addLocation({ name: '인천광역시 남동구 만수3동', lat: 37.4591611111111, lon: 126.725177777777, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['만수동'] });
    addLocation({ name: '인천광역시 남동구 만수4동', lat: 37.4566972222222, lon: 126.737711111111, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['만수동'] });
    addLocation({ name: '인천광역시 남동구 만수5동', lat: 37.4552083333333, lon: 126.7299, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['만수동'] });
    addLocation({ name: '인천광역시 남동구 만수6동', lat: 37.4409138888888, lon: 126.739752777777, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['만수동'] });
    addLocation({ name: '인천광역시 남동구 장수서창동', lat: 37.4330833333333, lon: 126.749452777777, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['장수동', '서창동'] });
    addLocation({ name: '인천광역시 남동구 서창2동', lat: 37.4240149, lon: 126.7521618, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['서창동'] });
    addLocation({ name: '인천광역시 남동구 남촌도림동', lat: 37.4293777777777, lon: 126.717286111111, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['남촌동', '도림동'] });
    addLocation({ name: '인천광역시 남동구 논현1동', lat: 37.40568978, lon: 126.7293199, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['논현동', '고잔동'] });
    addLocation({ name: '인천광역시 남동구 논현2동', lat: 37.40422435, lon: 126.7163943, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['논현동', '고잔동'] });
    addLocation({ name: '인천광역시 남동구 논현고잔동', lat: 37.4014527777777, lon: 126.718341666666, type: '행정동', admin_parent: '인천광역시 남동구', legal_divisions: ['논현동', '고잔동'] });

    // 부평구 및 하위 동
    addLocation({ name: '인천광역시 부평구', lat: 37.5042666666666, lon: 126.7241, type: '기초자치단체', admin_parent: '인천광역시' });
    addLocation({ name: '인천광역시 부평구 부평1동', lat: 37.4914333333333, lon: 126.722108333333, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['부평동'] });
    addLocation({ name: '인천광역시 부평구 부평2동', lat: 37.4840888888888, lon: 126.720041666666, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['부평동'] });
    addLocation({ name: '인천광역시 부평구 부평3동', lat: 37.4832388888888, lon: 126.710286111111, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['부평동'] });
    addLocation({ name: '인천광역시 부평구 부평4동', lat: 37.4980416666666, lon: 126.727, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['부평동'] });
    addLocation({ name: '인천광역시 부평구 부평5동', lat: 37.490825, lon: 126.730475, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['부평동'] });
    addLocation({ name: '인천광역시 부평구 부평6동', lat: 37.4836305555555, lon: 126.726533333333, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['부평동'] });
    addLocation({ name: '인천광역시 부평구 산곡1동', lat: 37.5041416666666, lon: 126.702319444444, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['산곡동'] });
    addLocation({ name: '인천광역시 부평구 산곡2동', lat: 37.50305, lon: 126.710708333333, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['산곡동'] });
    addLocation({ name: '인천광역시 부평구 산곡3동', lat: 37.4879527777777, lon: 126.711511111111, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['산곡동'] });
    addLocation({ name: '인천광역시 부평구 산곡4동', lat: 37.499075, lon: 126.713544444444, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['산곡동'] });
    addLocation({ name: '인천광역시 부평구 청천1동', lat: 37.5139277777777, lon: 126.703897222222, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['청천동'] });
    addLocation({ name: '인천광역시 부평구 청천2동', lat: 37.5120611111111, lon: 126.706533333333, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['청천동'] });
    addLocation({ name: '인천광역시 부평구 갈산1동', lat: 37.5148111111111, lon: 126.729344444444, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['갈산동'] });
    addLocation({ name: '인천광역시 부평구 갈산2동', lat: 37.5079555555555, lon: 126.727930555555, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['갈산동'] });
    addLocation({ name: '인천광역시 부평구 삼산1동', lat: 37.5156277777777, lon: 126.739777777777, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['삼산동'] });
    addLocation({ name: '인천광역시 부평구 삼산2동', lat: 37.5089722222222, lon: 126.738486111111, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['삼산동'] });
    addLocation({ name: '인천광역시 부평구 부개1동', lat: 37.4827, lon: 126.739108333333, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['부개동'] });
    addLocation({ name: '인천광역시 부평구 부개2동', lat: 37.492, lon: 126.739222222222, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['부개동'] });
    addLocation({ name: '인천광역시 부평구 부개3동', lat: 37.5015638888888, lon: 126.737, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['부개동'] });
    addLocation({ name: '인천광역시 부평구 일신동', lat: 37.4815666666666, lon: 126.748977777777, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['일신동'] });
    addLocation({ name: '인천광역시 부평구 십정1동', lat: 37.4729722222222, lon: 126.6982, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['십정동'] });
    addLocation({ name: '인천광역시 부평구 십정2동', lat: 37.471, lon: 126.710130555555, type: '행정동', admin_parent: '인천광역시 부평구', legal_divisions: ['십정동'] });

    // 계양구 및 하위 동
    addLocation({ name: '인천광역시 계양구', lat: 37.5347916666666, lon: 126.739752777777, type: '기초자치단체', admin_parent: '인천광역시' });
    addLocation({ name: '인천광역시 계양구 효성1동', lat: 37.5296055555555, lon: 126.714222222222, type: '행정동', admin_parent: '인천광역시 계양구', legal_divisions: ['효성동'] });
    addLocation({ name: '인천광역시 계양구 효성2동', lat: 37.5222333333333, lon: 126.711863888888, type: '행정동', admin_parent: '인천광역시 계양구', legal_divisions: ['효성동'] });
    addLocation({ name: '인천광역시 계양구 계산1동', lat: 37.5401083333333, lon: 126.726575, type: '행정동', admin_parent: '인천광역시 계양구', legal_divisions: ['계산동'] });
    addLocation({ name: '인천광역시 계양구 계산2동', lat: 37.5446222222222, lon: 126.729263888888, type: '행정동', admin_parent: '인천광역시 계양구', legal_divisions: ['계산동'] });
    addLocation({ name: '인천광역시 계양구 계산3동', lat: 37.5339277777777, lon: 126.731133333333, type: '행정동', admin_parent: '인천광역시 계양구', legal_divisions: ['계산동'] });
    addLocation({ name: '인천광역시 계양구 계산4동', lat: 37.5317833333333, lon: 126.743897222222, type: '행정동', admin_parent: '인천광역시 계양구', legal_divisions: ['계산동'] });
    addLocation({ name: '인천광역시 계양구 작전1동', lat: 37.5279194444444, lon: 126.731886111111, type: '행정동', admin_parent: '인천광역시 계양구', legal_divisions: ['작전동'] });
    addLocation({ name: '인천광역시 계양구 작전2동', lat: 37.5300888888888, lon: 126.726066666666, type: '행정동', admin_parent: '인천광역시 계양구', legal_divisions: ['작전동'] });
    addLocation({ name: '인천광역시 계양구 작전서운동', lat: 37.5252388888888, lon: 126.738552777777, type: '행정동', admin_parent: '인천광역시 계양구', legal_divisions: ['작전동', '서운동'] });
    addLocation({ name: '인천광역시 계양구 계양1동', lat: 37.5741027777777, lon: 126.736241666666, type: '행정동', admin_parent: '인천광역시 계양구', legal_divisions: ['다남동', '방축동', '선주지동', '오류동', '이화동', '하야동', '상야동'] });
    addLocation({ name: '인천광역시 계양구 계양2동', lat: 37.5409555555555, lon: 126.739166666666, type: '행정동', admin_parent: '인천광역시 계양구', legal_divisions: ['병방동', '임학동'] });
    addLocation({ name: '인천광역시 계양구 계양3동', lat: 37.5591666666667, lon: 126.7604, type: '행정동', admin_parent: '인천광역시 계양구', legal_divisions: ['박촌동', '동양동', '귤현동', '상야동', '하야동'] });

    // 서구 및 하위 동
    addLocation({ name: '인천광역시 서구', lat: 37.5426916666666, lon: 126.6782, type: '기초자치단체', admin_parent: '인천광역시' });
    addLocation({ name: '인천광역시 서구 검암경서동', lat: 37.5616611111111, lon: 126.675708333333, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['검암동', '경서동'] });
    addLocation({ name: '인천광역시 서구 연희동', lat: 37.546225, lon: 126.680266666666, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['연희동'] });
    addLocation({ name: '인천광역시 서구 청라1동', lat: 37.53197235, lon: 126.653834, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['청라동'], aliases: ['청라'] });
    addLocation({ name: '인천광역시 서구 청라2동', lat: 37.53196667, lon: 126.6410139, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['청라동'] });
    addLocation({ name: '인천광역시 서구 청라3동', lat: 37.5246933, lon: 126.6295261, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['청라동'] });
    addLocation({ name: '인천광역시 서구 가정1동', lat: 37.5204472222222, lon: 126.676533333333, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['가정동'] });
    addLocation({ name: '인천광역시 서구 가정2동', lat: 37.5235527777777, lon: 126.679833333333, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['가정동'] });
    addLocation({ name: '인천광역시 서구 가정3동', lat: 37.5127194444444, lon: 126.679919444444, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['가정동'] });
    addLocation({ name: '인천광역시 서구 석남1동', lat: 37.5083555555555, lon: 126.676797222222, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['석남동'] });
    addLocation({ name: '인천광역시 서구 석남2동', lat: 37.4998111111111, lon: 126.676697222222, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['석남동'] });
    addLocation({ name: '인천광역시 서구 석남3동', lat: 37.5054194444444, lon: 126.680375, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['석남동'] });
    addLocation({ name: '인천광역시 서구 신현원창동', lat: 37.5117972222222, lon: 126.674352777777, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['신현동', '원창동'] });
    addLocation({ name: '인천광역시 서구 가좌1동', lat: 37.4911138888888, lon: 126.675097222222, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['가좌동'] });
    addLocation({ name: '인천광역시 서구 가좌2동', lat: 37.48805, lon: 126.686952777777, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['가좌동'] });
    addLocation({ name: '인천광역시 서구 가좌3동', lat: 37.4896527777777, lon: 126.681877777777, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['가좌동'] });
    addLocation({ name: '인천광역시 서구 가좌4동', lat: 37.4846222222222, lon: 126.685686111111, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['가좌동'] });
    addLocation({ name: '인천광역시 서구 검단동', lat: 37.5993805555555, lon: 126.663375, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['검단동', '마전동', '왕길동', '불로동', '원당동', '당하동', '대곡동', '오류동', '금곡동', '경서동'] }); // 검단 지역 통합
    addLocation({ name: '인천광역시 서구 불로대곡동', lat: 37.6143611111111, lon: 126.690977777777, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['불로동', '대곡동'] });
    addLocation({ name: '인천광역시 서구 원당동', lat: 37.5911138888888, lon: 126.699844444444, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['원당동'] });
    addLocation({ name: '인천광역시 서구 당하동', lat: 37.5911722222222, lon: 126.677311111111, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['당하동'] });
    addLocation({ name: '인천광역시 서구 오류왕길동', lat: 37.597691, lon: 126.637152, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['오류동', '왕길동'] });
    addLocation({ name: '인천광역시 서구 마전동', lat: 37.5929616, lon: 126.6613294, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['마전동'] });
    addLocation({ name: '인천광역시 서구 아라동', lat: 37.594, lon: 126.7156, type: '행정동', admin_parent: '인천광역시 서구', legal_divisions: ['원당동', '당하동', '마전동', '불로동', '대곡동'] }); // 아라동은 검단 지역의 신설 행정동으로 여러 법정동 포함

    // 강화군 및 하위 읍/면
    addLocation({ name: '인천광역시 강화군', lat: 37.7438583333333, lon: 126.49, type: '기초자치단체', admin_parent: '인천광역시', aliases: ['강화도'] });
    addLocation({ name: '인천광역시 강화군 강화읍', lat: 37.7455416666666, lon: 126.485597222222, type: '읍', admin_parent: '인천광역시 강화군', legal_divisions: ['강화읍'] });
    addLocation({ name: '인천광역시 강화군 선원면', lat: 37.7105055555555, lon: 126.486886111111, type: '면', admin_parent: '인천광역시 강화군', legal_divisions: ['선원면'] });
    addLocation({ name: '인천광역시 강화군 불은면', lat: 37.6838555555555, lon: 126.482419444444, type: '면', admin_parent: '인천광역시 강화군', legal_divisions: ['불은면'] });
    addLocation({ name: '인천광역시 강화군 길상면', lat: 37.637825, lon: 126.493166666666, type: '면', admin_parent: '인천광역시 강화군', legal_divisions: ['길상면'] });
    addLocation({ name: '인천광역시 강화군 화도면', lat: 37.6289083333333, lon: 126.422277777777, type: '면', admin_parent: '인천광역시 강화군', legal_divisions: ['화도면'] });
    addLocation({ name: '인천광역시 강화군 양도면', lat: 37.6599861111111, lon: 126.424155555555, type: '면', admin_parent: '인천광역시 강화군', legal_divisions: ['양도면'] });
    addLocation({ name: '인천광역시 강화군 내가면', lat: 37.7166, lon: 126.391886111111, type: '면', admin_parent: '인천광역시 강화군', legal_divisions: ['내가면'] });
    addLocation({ name: '인천광역시 강화군 하점면', lat: 37.7719388888888, lon: 126.413641666666, type: '면', admin_parent: '인천광역시 강화군', legal_divisions: ['하점면'] });
    addLocation({ name: '인천광역시 강화군 양사면', lat: 37.795825, lon: 126.410219444444, type: '면', admin_parent: '인천광역시 강화군', legal_divisions: ['양사면'] });
    addLocation({ name: '인천광역시 강화군 송해면', lat: 37.761775, lon: 126.465441666666, type: '면', admin_parent: '인천광역시 강화군', legal_divisions: ['송해면'] });
    addLocation({ name: '인천광역시 강화군 교동면', lat: 37.7774416666666, lon: 126.282611111111, type: '면', admin_parent: '인천광역시 강화군', legal_divisions: ['교동면'] });
    addLocation({ name: '인천광역시 강화군 삼산면', lat: 37.7006805555555, lon: 126.322875, type: '면', admin_parent: '인천광역시 강화군', legal_divisions: ['삼산면'] });
    addLocation({ name: '인천광역시 강화군 서도면', lat: 37.6475805555555, lon: 126.242108333333, type: '면', admin_parent: '인천광역시 강화군', legal_divisions: ['서도면'] });

    // 옹진군 및 하위 면
    addLocation({ name: '인천광역시 옹진군', lat: 37.4437249999999, lon: 126.638888888888, type: '기초자치단체', admin_parent: '인천광역시' }); // 옹진군청 위치 (본토)
    addLocation({ name: '인천광역시 옹진군 북도면', lat: 37.529675, lon: 126.429133333333, type: '면', admin_parent: '인천광역시 옹진군', legal_divisions: ['북도면'], aliases: ['신도', '시도', '모도', '장봉도'] });
    addLocation({ name: '인천광역시 옹진군 백령면', lat: 37.9741764, lon: 124.7186911, type: '면', admin_parent: '인천광역시 옹진군', legal_divisions: ['백령면'], aliases: ['백령도'] });
    addLocation({ name: '인천광역시 옹진군 대청면', lat: 37.8256, lon: 124.7141, type: '면', admin_parent: '인천광역시 옹진군', legal_divisions: ['대청면'], aliases: ['대청도'] });
    addLocation({ name: '인천광역시 옹진군 덕적면', lat: 37.2235805555555, lon: 126.148888888888, type: '면', admin_parent: '인천광역시 옹진군', legal_divisions: ['덕적면'], aliases: ['덕적도'] });
    addLocation({ name: '인천광역시 옹진군 영흥면', lat: 37.2529388888888, lon: 126.485911111111, type: '면', admin_parent: '인천광역시 옹진군', legal_divisions: ['영흥면'], aliases: ['영흥도'] });
    addLocation({ name: '인천광역시 옹진군 자월면', lat: 37.24825, lon: 126.313219444444, type: '면', admin_parent: '인천광역시 옹진군', legal_divisions: ['자월면'], aliases: ['자월도'] });
    addLocation({ name: '인천광역시 옹진군 연평면', lat: 37.6623888888888, lon: 125.704108333333, type: '면', admin_parent: '인천광역시 옹진군', legal_divisions: ['연평면'], aliases: ['연평도'] });






    // 세종특별자치시 (광역자치단체) - 위경도.txt에서 가져옴
    addLocation({ lat: 36.4800121, lon: 127.2890691, name: '세종특별자치시', type: '광역자치단체', admin_parent: '', aliases: ['세종', '세종시'] });

    // 세종특별자치시 (기초자치단체 역할, 자체적인 구 개념이 없으므로)
    // 별도의 기초자치단체는 없지만, 편의상 최상위 광역자치단체와 동일한 이름으로 기초자치단체 역할을 추가
    // legal_divisions는 포함하지 않습니다.
    addLocation({ name: '세종특별자치시', type: '기초자치단체', admin_parent: '세종특별자치시', aliases: ['세종시'] });

    // 읍/면 데이터 - 위경도.txt 및 행정코드.txt 조합
    addLocation({ lat: 36.604528, lon: 127.298399, name: '세종특별자치시 조치원읍', type: '읍', admin_parent: '세종특별자치시', legal_divisions: ['교리', '남리', '번암리', '상리', '신안리', '원리', '정리', '죽림리', '침산리'] });
    addLocation({ lat: 36.5418737, lon: 127.2737741, name: '세종특별자치시 연기면', type: '면', admin_parent: '세종특별자치시', legal_divisions: ['연기리', '산울리', '세종리', '보통리', '누리'] });
    addLocation({ lat: 36.5590889, lon: 127.3268658, name: '세종특별자치시 연동면', type: '면', admin_parent: '세종특별자치시', legal_divisions: ['내판리', '노송리', '예양리', '용호리', '응암리', '명학리'] });
    addLocation({ lat: 36.527112, lon: 127.370376, name: '세종특별자치시 부강면', type: '면', admin_parent: '세종특별자치시', legal_divisions: ['부강리', '노호리', '산수리', '등곡리', '문곡리', '금호리', '갈산리', '행산리', '강수리', '부강산업단지'] });
    addLocation({ lat: 36.463826, lon: 127.28035, name: '세종특별자치시 금남면', type: '면', admin_parent: '세종특별자치시', legal_divisions: ['용담리', '성덕리', '도남리', '박산리', '발산리', '대박리', '영대리', '축산리', '장재리', '용포리', '금천리', '부용리', '호탄리', '달전리', '국곡리', '영곡리', '두만리', '황룡리'] });
    addLocation({ lat: 36.4967934, lon: 127.2056006, name: '세종특별자치시 장군면', type: '면', admin_parent: '세종특별자치시', legal_divisions: ['하봉리', '봉안리', '도계리', '송문리', '금암리', '대교리', '평기리', '용암리', '산학리', '대전리', '송학리'] });
    addLocation({ lat: 36.592587, lon: 127.2716217, name: '세종특별자치시 연서면', type: '면', admin_parent: '세종특별자치시', legal_divisions: ['봉암리', '쌍류리', '성제리', '용암리', '부동리', '고복리', '국촌리', '청라리', '와촌리', '신대리', '월하리'] });
    addLocation({ lat: 36.6812513, lon: 127.1955125, name: '세종특별자치시 전의면', type: '면', admin_parent: '세종특별자치시', legal_divisions: ['관정리', '유천리', '달전리', '신방리', '동교리', '노장리', '원성리', '읍내리', '양곡리', '금사리', '다방리', '서정리', '심중리', '소정리', '운당리'] });
    addLocation({ lat: 36.6560904, lon: 127.2641625, name: '세종특별자치시 전동면', type: '면', admin_parent: '세종특별자치시', legal_divisions: ['노장리', '청송리', '미곡리', '봉대리', '보덕리', '송정리', '심중리', '운주산', '방축리'] });
    addLocation({ lat: 36.7223175, lon: 127.1582525, name: '세종특별자치시 소정면', type: '면', admin_parent: '세종특별자치시', legal_divisions: ['소정리', '대곡리', '고등리', '운당리'] });

    // 행정동 데이터 - 위경도.txt 및 행정코드.txt 조합
    addLocation({ lat: 36.4790361111111, lon: 127.254625, name: '세종특별자치시 한솔동', type: '행정동', admin_parent: '세종특별자치시', legal_divisions: ['한솔동'] });
    addLocation({ lat: 36.486542, lon: 127.256899, name: '세종특별자치시 새롬동', type: '행정동', admin_parent: '세종특별자치시', legal_divisions: ['새롬동'] });
    addLocation({ lat: 36.4891526, lon: 127.26430552, name: '세종특별자치시 나성동', type: '행정동', admin_parent: '세종특별자치시', legal_divisions: ['나성동'] });
    addLocation({ lat: 36.51731111, lon: 127.2623972, name: '세종특별자치시 도담동', type: '행정동', admin_parent: '세종특별자치시', legal_divisions: ['도담동', '어진동', '해밀동'] }); // 어진동, 해밀동은 도담동 관할
    addLocation({ lat: 36.50174491, lon: 127.2567079, name: '세종특별자치시 어진동', type: '행정동', admin_parent: '세종특별자치시', legal_divisions: ['어진동'], aliases: ['정부세종청사'] });
    addLocation({ lat: 36.5270220158487, lon: 127.268085471711, name: '세종특별자치시 해밀동', type: '행정동', admin_parent: '세종특별자치시', legal_divisions: ['해밀동'] });
    addLocation({ lat: 36.5120416666667, lon: 127.248222222222, name: '세종특별자치시 아름동', type: '행정동', admin_parent: '세종특별자치시', legal_divisions: ['아름동'] });
    addLocation({ lat: 36.5119569, lon: 127.247612, name: '세종특별자치시 종촌동', type: '행정동', admin_parent: '세종특별자치시', legal_divisions: ['종촌동'] });
    addLocation({ lat: 36.519776, lon: 127.236841, name: '세종특별자치시 고운동', type: '행정동', admin_parent: '세종특별자치시', legal_divisions: ['고운동'] });
    addLocation({ lat: 36.4835223, lon: 127.3011911, name: '세종특별자치시 소담동', type: '행정동', admin_parent: '세종특별자치시', legal_divisions: ['소담동', '반곡동'] }); // 반곡동은 소담동 관할
    addLocation({ lat: 36.4987531567432, lon: 127.310678329828, name: '세종특별자치시 반곡동', type: '행정동', admin_parent: '세종특별자치시', legal_divisions: ['반곡동'] });
    addLocation({ lat: 36.47885, lon: 127.290412, name: '세종특별자치시 보람동', type: '행정동', admin_parent: '세종특별자치시', legal_divisions: ['보람동'] });
    addLocation({ lat: 36.4712699, lon: 127.2795296, name: '세종특별자치시 대평동', type: '행정동', admin_parent: '세종특별자치시', legal_divisions: ['대평동'] });
    addLocation({ lat: 36.4939773, lon: 127.2479133, name: '세종특별자치시 다정동', type: '행정동', admin_parent: '세종특별자치시', legal_divisions: ['다정동'] });






  // 제주특별자치도 데이터 (한 줄로 정리됨)
    addLocation({ lat: 33.4891, lon: 126.5135, name: '제주특별자치도', type: '광역자치단체', aliases: ['제주', '제주도'], priority_score: priorityMap['제주특별자치도'] });
    addLocation({ lat: 33.5073, lon: 126.5148, name: '제주특별자치시 제주시', type: '기초자치단체', admin_parent: '제주특별자치도', aliases: [], priority_score: priorityMap['제주시'] });
    addLocation({ lat: 33.5130, lon: 126.5270, name: '제주특별자치시 제주시 일도1동', type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['일도일동'], aliases: [], priority_score: priorityMap['일도1동'] });
    addLocation({ lat: 33.5078, lon: 126.5362, name: '제주특별자치시 제주시 일도2동', type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['일도이동'], aliases: [], priority_score: priorityMap['일도2동'] });
    addLocation({ lat: 33.5060, lon: 126.5180, name: '제주특별자치시 제주시 이도1동', type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['이도일동'], aliases: [], priority_score: priorityMap['이도1동'] });
    addLocation({ lat: 33.4975, lon: 126.5337, name: '제주특별자치시 제주시 이도2동', type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['이도이동', '도남동', '영평동', '오등동'], aliases: ['도남'], priority_score: priorityMap['이도2동'] });
    addLocation({ lat: 33.5113, lon: 126.5120, name: '제주특별자치시 제주시 삼도1동', type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['삼도일동'], aliases: [], priority_score: priorityMap['삼도1동'] });
    addLocation({ lat: 33.5090, lon: 126.5080, name: '제주특별자치시 제주시 삼도2동', type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['삼도이동'], aliases: [], priority_score: priorityMap['삼도2동'] });
    addLocation({ lat: 33.5140, lon: 126.5360, name: '제주특별자치시 제주시 건입동', type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['건입동'], aliases: [], priority_score: priorityMap['건입동'] });
    addLocation({ lat: 33.5210, lon: 126.5700, name: '제주특별자치시 제주시 화북동', type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['화북일동', '화북이동'], aliases: [], priority_score: priorityMap['화북동'] });
    addLocation({ lat: 33.5260, lon: 126.6010, name: '제주특별자치시 제주시 삼양동', type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['삼양일동', '삼양이동', '삼양삼동'], aliases: [], priority_score: priorityMap['삼양동'] });
    addLocation({ lat: 33.4590, lon: 126.6190, name: '제주특별자치시 제주시 봉개동', type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['봉개동'], aliases: [], priority_score: priorityMap['봉개동'] });
    addLocation({ lat: 33.4680, lon: 126.5490, name: '제주특별자치시 제주시 아라동', type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['아라일동', '아라이동'], aliases: [], priority_score: priorityMap['아라동'] });
    addLocation({ lat: 33.4800, lon: 126.4990, name: '제주특별자치시 제주시 오라동', type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['오라일동', '오라이동', '오라삼동'], aliases: [], priority_score: priorityMap['오라동'] });
    addLocation({ lat: 33.4890, lon: 126.4900, name: '제주특별자치시 제주시 연동', type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['연동'], aliases: [], priority_score: priorityMap['연동'] });
    addLocation({ lat: 33.4850, lon: 126.4670, name: '제주특별자치시 제주시 노형동', type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['노형동'], aliases: [], priority_score: priorityMap['노형동'] });
    addLocation({ lat: 33.5040, lon: 126.4490, name: '제주특별자치시 제주시 외도동', type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['외도일동', '외도이동', '외도삼동'], aliases: [], priority_score: priorityMap['외도동'] });
    addLocation({ lat: 33.5130, lon: 126.4710, name: '제주특별자치시 제주시 이호동', type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['이호일동', '이호이동'], aliases: [], priority_score: priorityMap['이호동'] });
    addLocation({ lat: 33.5160, lon: 126.4350, name: '제주특별자치시 제주시 도두동', type: '행정동', admin_parent: '제주특별자치시 제주시', legal_divisions: ['도두일동', '도두이동'], aliases: [], priority_score: priorityMap['도두동'] });
    addLocation({ lat: 33.4560, lon: 126.3300, name: '제주특별자치시 제주시 애월읍', type: '읍', admin_parent: '제주특별자치시 제주시', legal_divisions: ['고내리', '고성리', '곽지리', '광령리', '구엄리', '금성리', '납읍리', '봉성리', '상가리', '상귀리', '소길리', '수산리', '애월리', '어음리', '신엄리', '유수암리'], aliases: [], priority_score: priorityMap['애월읍'] });
    addLocation({ lat: 33.4140, lon: 126.2570, name: '제주특별자치시 제주시 한림읍', type: '읍', admin_parent: '제주특별자치시 제주시', legal_divisions: ['귀덕리', '금능리', '금악리', '대림리', '동명리', '명월리', '상대리', '상명리', '수원리', '옹포리', '월령리', '월림리', '한림리', '한수리', '협재리'], aliases: [], priority_score: priorityMap['한림읍'] });
    addLocation({ lat: 33.5180, lon: 126.8370, name: '제주특별자치시 제주시 구좌읍', type: '읍', admin_parent: '제주특별자치시 제주시', legal_divisions: ['김녕리', '덕천리', '동복리', '상도리', '세화리', '송당리', '월정리', '종달리', '평대리', '하도리', '한동리', '행원리'], aliases: [], priority_score: priorityMap['구좌읍'] });
    addLocation({ lat: 33.5320, lon: 126.6800, name: '제주특별자치시 제주시 조천읍', type: '읍', admin_parent: '제주특별자치시 제주시', legal_divisions: ['교래리', '대흘리', '북촌리', '선흘리', '신촌리', '신흥리', '와산리', '와흘리', '조천리', '함덕리'], aliases: [], priority_score: priorityMap['조천읍'] });
    addLocation({ lat: 33.3280, lon: 126.1730, name: '제주특별자치시 제주시 한경면', type: '면', admin_parent: '제주특별자치시 제주시', legal_divisions: ['고산리', '금등리', '낙천리', '두모리', '신창리', '용수리', '저지리', '조수리', '청수리', '판포리'], aliases: [], priority_score: priorityMap['한경면'] });
    addLocation({ lat: 33.9500, lon: 126.3200, name: '제주특별자치시 제주시 추자면', type: '면', admin_parent: '제주특별자치시 제주시', legal_divisions: ['대서리', '묵리', '신양리', '영흥리', '예초리'], aliases: ['추자'], priority_score: priorityMap['추자면'] });
    addLocation({ lat: 33.5040, lon: 126.9530, name: '제주특별자치시 제주시 우도면', type: '면', admin_parent: '제주특별자치시 제주시', legal_divisions: ['연평리'], aliases: ['우도'], priority_score: priorityMap['우도면'] });
    addLocation({ lat: 33.2540, lon: 126.5600, name: '제주특별자치시 서귀포시', type: '기초자치단체', admin_parent: '제주특별자치도', aliases: ['서귀포'], priority_score: priorityMap['서귀포시'] });
    addLocation({ lat: 33.2490, lon: 126.5690, name: '제주특별자치시 서귀포시 정방동', type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['서귀동'], aliases: [], priority_score: priorityMap['정방동'] });
    addLocation({ lat: 33.2500, lon: 126.5630, name: '제주특별자치시 서귀포시 중앙동', type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['서귀동'], aliases: [], priority_score: priorityMap['중앙동'] });
    addLocation({ lat: 33.2470, lon: 126.5560, name: '제주특별자치시 서귀포시 천지동', type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['서귀동', '서홍동'], aliases: [], priority_score: priorityMap['천지동'] });
    addLocation({ lat: 33.2800, lon: 126.6100, name: '제주특별자치시 서귀포시 효돈동', type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['하효동', '신효동'], aliases: [], priority_score: priorityMap['효돈동'] });
    addLocation({ lat: 33.2850, lon: 126.5800, name: '제주특별자치시 서귀포시 영천동', type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['토평동', '서귀동'], aliases: [], priority_score: priorityMap['영천동'] });
    addLocation({ lat: 33.2700, lon: 126.5750, name: '제주특별자치시 서귀포시 동홍동', type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['동홍동'], aliases: [], priority_score: priorityMap['동홍동'] });
    addLocation({ lat: 33.2600, lon: 126.5400, name: '제주특별자치시 서귀포시 서홍동', type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['서홍동'], aliases: [], priority_score: priorityMap['서홍동'] });
    addLocation({ lat: 33.2450, lon: 126.5200, name: '제주특별자치시 서귀포시 대륜동', type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['법환동', '서호동', '호근동'], aliases: [], priority_score: priorityMap['대륜동'] });
    addLocation({ lat: 33.2580, lon: 126.4900, name: '제주특별자치시 서귀포시 대천동', type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['강정동', '도순동', '영남동', '월평동'], aliases: [], priority_score: priorityMap['대천동'] });
    addLocation({ lat: 33.2440, lon: 126.4300, name: '제주특별자치시 서귀포시 중문동', type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['중문동', '대포동', '하원동', '회수동'], aliases: [], priority_score: priorityMap['중문동'] });
    addLocation({ lat: 33.2480, lon: 126.3800, name: '제주특별자치시 서귀포시 예래동', type: '행정동', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['예래동', '상예동', '하예동'], aliases: [], priority_score: priorityMap['예래동'] });
    addLocation({ lat: 33.2260, lon: 126.2570, name: '제주특별자치시 서귀포시 대정읍', type: '읍', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['하모리', '상모리', '신평리', '영락리', '무릉리', '보성리', '안성리', '구억리', '인성리', '일과리', '동일1리', '동일2리', '가파리', '마라리'], aliases: [], priority_score: priorityMap['대정읍'] });
    addLocation({ lat: 33.2800, lon: 126.7300, name: '제주특별자치시 서귀포시 남원읍', type: '읍', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['남원리', '위미리', '태흥리', '한남리', '의귀리', '신례리', '하례리'], aliases: [], priority_score: priorityMap['남원읍'] });
    addLocation({ lat: 33.3800, lon: 126.8900, name: '제주특별자치시 서귀포시 성산읍', type: '읍', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['성산리', '고성리', '온평리', '신풍리', '수산리', '신천리', '삼달리', '오조리', '시흥리'], aliases: ['성산일출봉'], priority_score: priorityMap['성산읍'] });
    addLocation({ lat: 33.2500, lon: 126.3100, name: '제주특별자치시 서귀포시 안덕면', type: '면', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['화순리', '감산리', '서광리', '동광리', '사계리', '창천리', '상창리', '광평리', '덕수리'], aliases: [], priority_score: priorityMap['안덕면'] });
    addLocation({ lat: 33.3000, lon: 126.8300, name: '제주특별자치시 서귀포시 표선면', type: '면', admin_parent: '제주특별자치시 서귀포시', legal_divisions: ['표선리', '세화리', '가시리', '성읍리', '하천리', '토산리'], aliases: [], priority_score: priorityMap['표선면'] });
    addLocation({ lat: 33.4584, lon: 126.9427, name: '성산일출봉', type: '별칭', admin_parent: '제주특별자치시 서귀포시 성산읍' });
    addLocation({ lat: 33.3616, lon: 126.5292, name: '한라산', type: '별칭', admin_parent: '제주특별자치도', aliases: ['한라산국립공원'] });
    addLocation({ lat: 33.5114, lon: 126.4927, name: '제주공항', type: '별칭', admin_parent: '제주특별자치시 제주시', aliases: ['제주국제공항'] });
    addLocation({ lat: 33.2497, lon: 126.5658, name: '서귀포 매일올레시장', type: '별칭', admin_parent: '제주특별자치시 서귀포시 중앙동' });
    addLocation({ lat: 33.3948, lon: 126.2393, name: '협재해수욕장', type: '별칭', admin_parent: '제주특별자치시 제주시 한림읍' });
    addLocation({ lat: 33.4140, lon: 126.3930, name: '새별오름', type: '별칭', admin_parent: '제주특별자치시 제주시 애월읍' });




    // 데이터 로드 확인용 통계 및 메타데이터
    // 실제 데이터가 없으므로 0으로 초기화
    const METADATA_INFO = {
        totalLocations: 0,
        lastUpdated: new Date().toISOString(),
        coverage: {
            cities: 0,
            adminDivisions: 0
        }
    };

    return {
        /**
         * 이름을 기반으로 지역 정보를 조회합니다.
         * @param {string} name - 조회할 지역의 이름 또는 별칭
         * @returns {Object|null} 해당 지역 정보 객체 또는 null
         */
        get: (name) => {
            return data[name] || null;
        },

        /**
         * 검색 쿼리에 따라 일치하는 지역 목록을 반환합니다.
         * 우선순위 점수를 기반으로 정렬됩니다.
         * @param {string} query - 사용자의 검색 쿼리
         * @returns {Array<Object>} 일치하는 지역 정보 객체 배열
         */
        findMatches: (query) => {
            if (!query) return [];
            const lowerCaseQuery = query.toLowerCase().replace(/\s/g, ''); // 공백 제거 후 소문자 변환

            const matches = [];
            for (const key in data) {
                const location = data[key];
                // location이 newLocation 객체를 참조하고 있고, 해당 객체에 name 속성이 있는지 확인
                const nameToSearch = location.name || key; 
                const nameMatches = nameToSearch.toLowerCase().replace(/\s/g, '').includes(lowerCaseQuery);
                const aliasMatches = (location.aliases || []).some(alias =>
                    alias.toLowerCase().replace(/\s/g, '').includes(lowerCaseQuery)
                );
                const legalDivMatches = (location.legal_divisions || []).some(legalDiv =>
                    legalDiv.toLowerCase().replace(/\s/g, '').includes(lowerCaseQuery)
                );

                if (nameMatches || aliasMatches || legalDivMatches) {
                    // 깊은 복사를 통해 원본 객체 변경 방지 및 `key`와 `priority` 추가
                    // 중요: findMatches에서 반환되는 객체에 priority_score를 추가하여 정렬에 사용
                    // addLocation에서 이미 priority_score를 설정하므로, 여기서 다시 계산할 필요는 없음.
                    matches.push({ ...location, key: key }); 
                }
            }

            // 우선순위가 높은 순으로 정렬
            return matches.sort((a, b) => {
                const priorityA = a.priority_score !== undefined ? a.priority_score : 0;
                const priorityB = b.priority_score !== undefined ? b.priority_score : 0;

                if (priorityA !== priorityB) {
                    return priorityB - priorityA; // 높은 점수가 먼저 오도록 내림차순 정렬
                }
                // 우선순위가 같으면 이름으로 정렬
                return a.name.localeCompare(b.name);
            });
        },

        /**
         * 특정 좌표에 가장 가까운 행정 구역을 찾습니다. (간단한 근접성 판단)
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
                const nameLower = (location.name || key).toLowerCase(); // location.name이 없을 경우 key 사용

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
                return (a.name || a.key).localeCompare(b.name || b.key);
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
        getMetadata: () => METADATA_INFO
    };
})();

// 파일 외부에서 접근할 수 있도록 내보냅니다. (CommonJS 방식)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { locationData, latLonToGrid };
}
