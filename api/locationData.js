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

        // 전국 주요 도시 및 지역 추가 (weather.js에서 이관)
        // 서울특별시 (구별 + 주요 동)
        '서울특별시': 1000, // 최상위 우선순위
        '종로구': 900, '중구': 900, '용산구': 900, '성동구': 900, '광진구': 900,
        '동대문구': 900, '중랑구': 900, '성북구': 900, '강북구': 900, '도봉구': 900,
        '노원구': 900, '은평구': 900, '서대문구': 900, '마포구': 900, '양천구': 900,
        '강서구': 900, '구로구': 900, '금천구': 900, '영등포구': 900, '동작구': 900,
        '관악구': 900, '서초구': 900, '강남구': 900, '송파구': 900, '강동구': 900,
        '명동': 850, '홍대': 850, '강남': 850, '이태원': 850, '잠실': 850,
        '여의도': 850, '신촌': 850, '동대문': 850, '종로': 850,

 '종각': 850, '경복궁': 850, '남산타워': 850, '남대문시장': 840, '광장시장': 830,
        '이태원': 850, '신촌': 850, '홍대': 850, '여의도': 850, '강남역': 850, '강남': 840,
        '가로수길': 830, '코엑스': 830, '잠실': 850,

        

    // 부산광역시
    '부산광역시': 980,
    '중구': 890, '서구': 890, '동구': 890, '영도구': 890, '부산진구': 890,
    '동래구': 890, '남구': 890, '북구': 890, '해운대구': 880, '사하구': 890,
    '금정구': 890, '강서구': 890, '연제구': 890, '수영구': 890, '사상구': 890,
    '기장군': 820,

    // 부산 주요 지역/별칭
    '해운대': 840,
    '광안리': 840,
    '서면': 840,
    '남포동': 840,
    '태종대': 830,
    '부산역': 830,

    // 기장군 하위 읍/면
    '기장읍': 810,
    '장안읍': 810,
    '정관읍': 810,
    '일광읍': 810,
    '철마면': 810,

  // 부산 주요 별칭
        '자갈치시장': 800, '국제시장': 790, '부산역': 780, '광복로': 770, '범어사': 760,
        '벡스코': 750, '부산항': 740, '깡통시장': 730, '송도해수욕장': 720, '광안대교': 710


    
  // 대구광역시
    '대구광역시': 970,
    '중구': 880, '동구': 880, '서구': 880, '남구': 880, '북구': 880,
    '수성구': 870, '달서구': 880, '달성군': 810, '군위군': 800,

    // 대구 주요 지역/별칭
    '동성로': 830,
    '팔공산': 820,
    '수성못': 820,
    '서문시장': 830,

    // 달성군 읍/면
    '화원읍': 805,
    '논공읍': 805,
    '다사읍': 805,
    '유가읍': 805,
    '옥포읍': 805,
    '현풍읍': 805,
    '가창면': 805,
    '하빈면': 805,
    '구지면': 805,

    // 군위군 읍/면
    '군위읍': 795,
    '소보면': 795,
    '효령면': 795,
    '부계면': 795,
    '우보면': 795,
    '의흥면': 795,
    '산성면': 795,
    '삼국유사면': 795,
     
        
        
        // 인천광역시
        '인천광역시': 960,
        '송도': 850, '월미도': 840, '강화군': 830, '을왕리': 820,

        // 광주광역시
        '광주광역시': 950,
        '무등산': 850,

        // 대전광역시
        '대전광역시': 940,
        '유성구': 850,

        // 울산광역시
        '울산광역시': 930,

        // 세종특별자치시
        '세종특별자치시': 920,

        // 경기도 주요 도시 (일부)
        '수원시': 800, '성남시': 800, '용인시': 800, '안양시': 800, '안산시': 800,
        '고양시': 800, '화성시': 800, '평택시': 800, '남양주시': 800, '부천시': 800,

        // 강원특별자치도 (일부)
        '강원특별자치도': 900,
        '춘천시': 800, '원주시': 800, '강릉시': 800, '속초시': 800,
        '설악산국립공원': 750, '오대산국립공원': 740, '정동진': 730,

        // 충청북도 (일부)
        '충청북도': 880,
        '청주시': 780, '충주시': 770, '제천시': 760,

        // 충청남도 (일부)
        '충청남도': 870,
        '천안시': 770, '공주시': 760, '보령시': 750,
        '태안군': 720, '태안 안면도': 710,

        // 전라북도 (일부)
        '전라북도': 860,
        '전주시': 760, '군산시': 750, '익산시': 740,
        '전주 한옥마을': 710, '내장산': 700,

        // 전라남도 (일부)
        '전라남도': 850,
        '목포시': 750, '여수시': 740, '순천시': 730,
        '여수 엑스포': 700, '보성 녹차밭': 690,

        // 경상북도 (일부)
        '경상북도': 840,
        '포항시': 740, '경주시': 730, '안동시': 720,
        '경주 역사유적지구': 690, '안동 하회마을': 680,

        // 경상남도 (일부)
        '경상남도': 830,
        '창원시': 730, '진주시': 720, '통영시': 710,
        '통영 케이블카': 680, '거제 외도': 670,

        // 기타 국립공원
        '지리산국립공원': 800, '북한산국립공원': 790, '계룡산국립공원': 780,
      
        // 관광지명 추가
        '성산일출봉': 700, // 성산읍보다 약간 낮은 우선순위 (관광지는 보통 행정구역보다 넓은 범위로 검색되지 않으므로)
        '한라산': 800,
        '제주공항': 920,
        '서귀포 매일올레시장': 650,
        '협재해수욕장': 600,
        '새별오름': 580
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





    // =============================================================
    // 서울특별시 (광역자치단체)
    addLocation('서울특별시', { lat: 37.5665, lon: 126.9780, name: '서울특별시', type: '광역자치단체', aliases: ['서울', '서울시'] });

    // =============================================================
    // 25개 구 및 주요 행정동/법정동 데이터

    // 종로구
    addLocation('종로구', { lat: 37.5735, lon: 126.9788, name: '서울특별시 종로구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('청운효자동', { lat: 37.5852, lon: 126.9691, name: '서울특별시 종로구 청운효자동', type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['청운동', '효자동', '궁정동', '신교동', '창성동', '통인동', '누하동', '옥인동', '신교동', '필운동', '내자동'] });
    addLocation('사직동', { lat: 37.5746, lon: 126.9702, name: '서울특별시 종로구 사직동', type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['사직동', '내수동', '도렴동', '당주동', '신문로1가', '신문로2가', '세종로'] });
    addLocation('삼청동', { lat: 37.5898, lon: 126.9806, name: '서울특별시 종로구 삼청동', type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['삼청동', '팔판동', '안국동', '화동'] });
    addLocation('평창동', { lat: 37.6080, lon: 126.9670, name: '서울특별시 종로구 평창동', type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['평창동'] });
    addLocation('가회동', { lat: 37.5830, lon: 126.9890, name: '서울특별시 종로구 가회동', type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['가회동', '재동', '계동', '원서동'] });
    addLocation('종로1.2.3.4가동', { lat: 37.5710, lon: 126.9910, name: '서울특별시 종로구 종로1.2.3.4가동', type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['종로1가', '종로2가', '종로3가', '종로4가', '인사동', '관철동', '관수동', '견지동', '공평동', '와룡동', '운니동', '익선동', '돈화문로'] });
    addLocation('혜화동', { lat: 37.5810, lon: 127.0000, name: '서울특별시 종로구 혜화동', type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['혜화동', '명륜1가', '명륜2가', '동숭동'] });
    addLocation('창신1동', { lat: 37.5780, lon: 127.0100, name: '서울특별시 종로구 창신1동', type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['창신동'] });
    addLocation('숭인1동', { lat: 37.5750, lon: 127.0200, name: '서울특별시 종로구 숭인1동', type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['숭인동'] });
    addLocation('종로', { lat: 37.5700, lon: 126.9790, name: '서울특별시 종로구 종로1가', type: '별칭', admin_parent: '서울특별시 종로구', aliases: ['종각'] });
    addLocation('경복궁', { lat: 37.5776, lon: 126.9769, name: '서울특별시 종로구 세종로', type: '별칭', admin_parent: '서울특별시 종로구' });


    // 중구
    addLocation('중구', { lat: 37.5630, lon: 126.9970, name: '서울특별시 중구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('소공동', { lat: 37.5630, lon: 126.9800, name: '서울특별시 중구 소공동', type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['소공동', '북창동', '태평로2가'] });
    addLocation('명동', { lat: 37.5610, lon: 126.9860, name: '서울특별시 중구 명동', type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['명동1가', '명동2가', '남산동1가', '남산동2가', '남산동3가', '충무로1가', '충무로2가', '저동1가', '저동2가', '예관동'], aliases: ['명동성당'] });
    addLocation('을지로동', { lat: 37.5650, lon: 126.9910, name: '서울특별시 중구 을지로동', type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['을지로1가', '을지로2가', '을지로3가', '을지로4가', '을지로5가', '을지로6가', '을지로7가', '수하동', '장교동', '삼각동', '입정동', '산림동', '주교동'] });
    addLocation('필동', { lat: 37.5600, lon: 127.0000, name: '서울특별시 중구 필동', type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['필동1가', '필동2가', '필동3가', '묵정동', '장충동1가', '장충동2가', '광희동1가', '광희동2가'] });
    addLocation('장충동', { lat: 37.5580, lon: 127.0090, name: '서울특별시 중구 장충동', type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['장충동1가', '장충동2가', '묵정동'] });
    addLocation('신당5동', { lat: 37.5680, lon: 127.0180, name: '서울특별시 중구 신당5동', type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['신당동'] });
    addLocation('황학동', { lat: 37.5710, lon: 127.0150, name: '서울특별시 중구 황학동', type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['황학동'] });
    addLocation('중림동', { lat: 37.5590, lon: 126.9670, name: '서울특별시 중구 중림동', type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['중림동'] });
    addLocation('회현동', { lat: 37.5580, lon: 126.9770, name: '서울특별시 중구 회현동', type: '행정동', admin_parent: '서울특별시 중구', legal_divisions: ['회현동1가', '회현동2가', '회현동3가', '남산동1가', '남산동2가', '남산동3가', '충무로1가'] });
    addLocation('남산타워', { lat: 37.5512, lon: 126.9880, name: '서울특별시 용산구 용산동2가', type: '별칭', admin_parent: '서울특별시 용산구', aliases: ['N서울타워'] });
    addLocation('남대문시장', { lat: 37.5590, lon: 126.9770, name: '서울특별시 중구 남대문로4가', type: '별칭', admin_parent: '서울특별시 중구' });
    addLocation('광장시장', { lat: 37.5709, lon: 127.0006, name: '서울특별시 종로구 예지동', type: '별칭', admin_parent: '서울특별시 종로구' });


    // 용산구
    addLocation('용산구', { lat: 37.5326, lon: 126.9905, name: '서울특별시 용산구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('후암동', { lat: 37.5450, lon: 126.9740, name: '서울특별시 용산구 후암동', type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['후암동'] });
    addLocation('용산2가동', { lat: 37.5380, lon: 126.9830, name: '서울특별시 용산구 용산2가동', type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['용산동2가'] });
    addLocation('남영동', { lat: 37.5410, lon: 126.9700, name: '서울특별시 용산구 남영동', type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['남영동', '갈월동'] });
    addLocation('원효로2동', { lat: 37.5350, lon: 126.9600, name: '서울특별시 용산구 원효로2동', type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['원효로2가', '원효로3가'] });
    addLocation('이촌1동', { lat: 37.5220, lon: 126.9700, name: '서울특별시 용산구 이촌1동', type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['이촌동'] });
    addLocation('이태원1동', { lat: 37.5345, lon: 126.9934, name: '서울특별시 용산구 이태원1동', type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['이태원동', '한남동'], aliases: ['이태원'] });
    addLocation('한남동', { lat: 37.5370, lon: 127.0090, name: '서울특별시 용산구 한남동', type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['한남동'] });
    addLocation('보광동', { lat: 37.5310, lon: 127.0060, name: '서울특별시 용산구 보광동', type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['보광동'] });
    addLocation('청파동', { lat: 37.5500, lon: 126.9690, name: '서울특별시 용산구 청파동', type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['청파동1가', '청파동2가', '청파동3가'] });
    addLocation('효창동', { lat: 37.5400, lon: 126.9600, name: '서울특별시 용산구 효창동', type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['효창동'] });
    addLocation('서빙고동', { lat: 37.5190, lon: 126.9820, name: '서울특별시 용산구 서빙고동', type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['서빙고동', '동빙고동'] });
    addLocation('용문동', { lat: 37.5330, lon: 126.9580, name: '서울특별시 용산구 용문동', type: '행정동', admin_parent: '서울특별시 용산구', legal_divisions: ['용문동'] });
    addLocation('이촌동', { lat: 37.5190, lon: 126.9740, name: '서울특별시 용산구 이촌동', type: '법정동', admin_parent: '서울특별시 용산구' });

    // 성동구
    addLocation('성동구', { lat: 37.5635, lon: 127.0365, name: '서울특별시 성동구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('왕십리2동', { lat: 37.5660, lon: 127.0290, name: '서울특별시 성동구 왕십리2동', type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['하왕십리동'] });
    addLocation('마장동', { lat: 37.5700, lon: 127.0430, name: '서울특별시 성동구 마장동', type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['마장동'] });
    addLocation('사근동', { lat: 37.5600, lon: 127.0400, name: '서울특별시 성동구 사근동', type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['사근동'] });
    addLocation('행당1동', { lat: 37.5580, lon: 127.0270, name: '서울특별시 성동구 행당1동', type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['행당동'] });
    addLocation('응봉동', { lat: 37.5460, lon: 127.0370, name: '서울특별시 성동구 응봉동', type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['응봉동'] });
    addLocation('금호1가동', { lat: 37.5500, lon: 127.0200, name: '서울특별시 성동구 금호1가동', type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['금호동1가'] });
    addLocation('성수1가1동', { lat: 37.5460, lon: 127.0470, name: '서울특별시 성동구 성수1가1동', type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['성수동1가'] });
    addLocation('옥수동', { lat: 37.5520, lon: 127.0140, name: '서울특별시 성동구 옥수동', type: '행정동', admin_parent: '서울특별시 성동구', legal_divisions: ['옥수동'] });

    // 광진구
    addLocation('광진구', { lat: 37.5384, lon: 127.0822, name: '서울특별시 광진구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('화양동', { lat: 37.5450, lon: 127.0690, name: '서울특별시 광진구 화양동', type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['화양동'] });
    addLocation('군자동', { lat: 37.5500, lon: 127.0760, name: '서울특별시 광진구 군자동', type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['군자동'] });
    addLocation('중곡1동', { lat: 37.5680, lon: 127.0850, name: '서울특별시 광진구 중곡1동', type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['중곡동'] });
    addLocation('능동', { lat: 37.5550, lon: 127.0800, name: '서울특별시 광진구 능동', type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['능동'] });
    addLocation('광장동', { lat: 37.5520, lon: 127.1030, name: '서울특별시 광진구 광장동', type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['광장동'] });
    addLocation('구의1동', { lat: 37.5370, lon: 127.0880, name: '서울특별시 광진구 구의1동', type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['구의동'] });
    addLocation('자양1동', { lat: 37.5320, lon: 127.0670, name: '서울특별시 광진구 자양1동', type: '행정동', admin_parent: '서울특별시 광진구', legal_divisions: ['자양동'] });

    // 동대문구
    addLocation('동대문구', { lat: 37.5744, lon: 127.0394, name: '서울특별시 동대문구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('용두동', { lat: 37.5740, lon: 127.0270, name: '서울특별시 동대문구 용두동', type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['용두동'] });
    addLocation('제기동', { lat: 37.5790, lon: 127.0350, name: '서울특별시 동대문구 제기동', type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['제기동'] });
    addLocation('전농1동', { lat: 37.5850, lon: 127.0500, name: '서울특별시 동대문구 전농1동', type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['전농동'] });
    addLocation('답십리1동', { lat: 37.5700, lon: 127.0500, name: '서울특별시 동대문구 답십리1동', type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['답십리동'] });
    addLocation('장안1동', { lat: 37.5700, lon: 127.0660, name: '서울특별시 동대문구 장안1동', type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['장안동'] });
    addLocation('청량리동', { lat: 37.5900, lon: 127.0480, name: '서울특별시 동대문구 청량리동', type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['청량리동'] });
    addLocation('회기동', { lat: 37.5940, lon: 127.0560, name: '서울특별시 동대문구 회기동', type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['회기동'] });
    addLocation('휘경1동', { lat: 37.5960, lon: 127.0620, name: '서울특별시 동대문구 휘경1동', type: '행정동', admin_parent: '서울특별시 동대문구', legal_divisions: ['휘경동'] });

    // 중랑구
    addLocation('중랑구', { lat: 37.6063, lon: 127.0925, name: '서울특별시 중랑구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('면목2동', { lat: 37.5890, lon: 127.0880, name: '서울특별시 중랑구 면목2동', type: '행정동', admin_parent: '서울특별시 중랑구', legal_divisions: ['면목동'] });
    addLocation('상봉1동', { lat: 37.5950, lon: 127.0870, name: '서울특별시 중랑구 상봉1동', type: '행정동', admin_parent: '서울특별시 중랑구', legal_divisions: ['상봉동'] });
    addLocation('중화1동', { lat: 37.6000, lon: 127.0810, name: '서울특별시 중랑구 중화1동', type: '행정동', admin_parent: '서울특별시 중랑구', legal_divisions: ['중화동'] });
    addLocation('묵1동', { lat: 37.6180, lon: 127.0780, name: '서울특별시 중랑구 묵1동', type: '행정동', admin_parent: '서울특별시 중랑구', legal_divisions: ['묵동'] });
    addLocation('망우3동', { lat: 37.6060, lon: 127.0970, name: '서울특별시 중랑구 망우3동', type: '행정동', admin_parent: '서울특별시 중랑구', legal_divisions: ['망우동'] });
    addLocation('신내1동', { lat: 37.6180, lon: 127.0960, name: '서울특별시 중랑구 신내1동', type: '행정동', admin_parent: '서울특별시 중랑구', legal_divisions: ['신내동'] });

    // 성북구
    addLocation('성북구', { lat: 37.5894, lon: 127.0167, name: '서울특별시 성북구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('성북동', { lat: 37.5950, lon: 127.0080, name: '서울특별시 성북구 성북동', type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['성북동'] });
    addLocation('삼선동', { lat: 37.5850, lon: 127.0130, name: '서울특별시 성북구 삼선동', type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['삼선동1가', '삼선동2가', '삼선동3가', '삼선동4가'] });
    addLocation('동선동', { lat: 37.5880, lon: 127.0210, name: '서울특별시 성북구 동선동', type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['동선동1가', '동선동2가', '동선동3가', '동선동4가', '동선동5가'] });
    addLocation('돈암1동', { lat: 37.5890, lon: 127.0170, name: '서울특별시 성북구 돈암1동', type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['돈암동'] });
    addLocation('안암동', { lat: 37.5870, lon: 127.0300, name: '서울특별시 성북구 안암동', type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['안암동1가', '안암동2가', '안암동3가', '안암동4가', '안암동5가'] });
    addLocation('정릉1동', { lat: 37.6000, lon: 127.0100, name: '서울특별시 성북구 정릉1동', type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['정릉동'] });
    addLocation('길음1동', { lat: 37.6050, lon: 127.0240, name: '서울특별시 성북구 길음1동', type: '행정동', admin_parent: '서울특별시 성북구', legal_divisions: ['길음동'] });

    // 강북구
    addLocation('강북구', { lat: 37.6397, lon: 127.0256, name: '서울특별시 강북구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('미아동', { lat: 37.6250, lon: 127.0250, name: '서울특별시 강북구 미아동', type: '법정동', admin_parent: '서울특별시 강북구' });
    addLocation('수유1동', { lat: 37.6380, lon: 127.0180, name: '서울특별시 강북구 수유1동', type: '행정동', admin_parent: '서울특별시 강북구', legal_divisions: ['수유동'] });
    addLocation('번1동', { lat: 37.6300, lon: 127.0400, name: '서울특별시 강북구 번1동', type: '행정동', admin_parent: '서울특별시 강북구', legal_divisions: ['번동'] });
    addLocation('삼각산동', { lat: 37.6470, lon: 127.0080, name: '서울특별시 강북구 삼각산동', type: '행정동', admin_parent: '서울특별시 강북구', legal_divisions: ['수유동', '우이동'] });
    addLocation('우이동', { lat: 37.6600, lon: 127.0180, name: '서울특별시 강북구 우이동', type: '법정동', admin_parent: '서울특별시 강북구' });

    // 도봉구
    addLocation('도봉구', { lat: 37.6688, lon: 127.0471, name: '서울특별시 도봉구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('쌍문1동', { lat: 37.6490, lon: 127.0340, name: '서울특별시 도봉구 쌍문1동', type: '행정동', admin_parent: '서울특별시 도봉구', legal_divisions: ['쌍문동'] });
    addLocation('방학1동', { lat: 37.6680, lon: 127.0380, name: '서울특별시 도봉구 방학1동', type: '행정동', admin_parent: '서울특별시 도봉구', legal_divisions: ['방학동'] });
    addLocation('창2동', { lat: 37.6480, lon: 127.0560, name: '서울특별시 도봉구 창2동', type: '행정동', admin_parent: '서울특별시 도봉구', legal_divisions: ['창동'] });
    addLocation('도봉1동', { lat: 37.6850, lon: 127.0450, name: '서울특별시 도봉구 도봉1동', type: '행정동', admin_parent: '서울특별시 도봉구', legal_divisions: ['도봉동'] });

    // 노원구
    addLocation('노원구', { lat: 37.6541, lon: 127.0568, name: '서울특별시 노원구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('월계1동', { lat: 37.6180, lon: 127.0570, name: '서울특별시 노원구 월계1동', type: '행정동', admin_parent: '서울특별시 노원구', legal_divisions: ['월계동'] });
    addLocation('공릉1동', { lat: 37.6260, lon: 127.0750, name: '서울특별시 노원구 공릉1동', type: '행정동', admin_parent: '서울특별시 노원구', legal_divisions: ['공릉동'] });
    addLocation('하계1동', { lat: 37.6170, lon: 127.0710, name: '서울특별시 노원구 하계1동', type: '행정동', admin_parent: '서울특별시 노원구', legal_divisions: ['하계동'] });
    addLocation('중계1동', { lat: 37.6370, lon: 127.0700, name: '서울특별시 노원구 중계1동', type: '행정동', admin_parent: '서울특별시 노원구', legal_divisions: ['중계동'] });
    addLocation('상계1동', { lat: 37.6530, lon: 127.0600, name: '서울특별시 노원구 상계1동', type: '행정동', admin_parent: '서울특별시 노원구', legal_divisions: ['상계동'] });
    addLocation('수락산', { lat: 37.6800, lon: 127.0700, name: '서울특별시 노원구 상계동', type: '별칭', admin_parent: '서울특별시 노원구' });

    // 은평구
    addLocation('은평구', { lat: 37.6176, lon: 126.9227, name: '서울특별시 은평구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('녹번동', { lat: 37.6100, lon: 126.9360, name: '서울특별시 은평구 녹번동', type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['녹번동'] });
    addLocation('불광1동', { lat: 37.6150, lon: 126.9300, name: '서울특별시 은평구 불광1동', type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['불광동'] });
    addLocation('갈현1동', { lat: 37.6250, lon: 126.9050, name: '서울특별시 은평구 갈현1동', type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['갈현동'] });
    addLocation('구산동', { lat: 37.6100, lon: 126.9050, name: '서울특별시 은평구 구산동', type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['구산동'] });
    addLocation('응암1동', { lat: 37.5980, lon: 126.9240, name: '서울특별시 은평구 응암1동', type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['응암동'] });
    addLocation('역촌동', { lat: 37.6050, lon: 126.9120, name: '서울특별시 은평구 역촌동', type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['역촌동'] });
    addLocation('진관동', { lat: 37.6350, lon: 126.9250, name: '서울특별시 은평구 진관동', type: '행정동', admin_parent: '서울특별시 은평구', legal_divisions: ['진관동', '구파발동'] });

    // 서대문구
    addLocation('서대문구', { lat: 37.5791, lon: 126.9368, name: '서울특별시 서대문구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('천연동', { lat: 37.5720, lon: 126.9530, name: '서울특별시 서대문구 천연동', type: '행정동', admin_parent: '서울특별시 서대문구', legal_divisions: ['천연동', '옥천동', '영천동'] });
    addLocation('홍제1동', { lat: 37.5880, lon: 126.9400, name: '서울특별시 서대문구 홍제1동', type: '행정동', admin_parent: '서울특별시 서대문구', legal_divisions: ['홍제동'] });
    addLocation('연희동', { lat: 37.5680, lon: 126.9370, name: '서울특별시 서대문구 연희동', type: '행정동', admin_parent: '서울특별시 서대문구', legal_divisions: ['연희동'] });
    addLocation('북가좌1동', { lat: 37.5850, lon: 126.9100, name: '서울특별시 서대문구 북가좌1동', type: '행정동', admin_parent: '서울특별시 서대문구', legal_divisions: ['북가좌동'] });
    addLocation('신촌동', { lat: 37.5598, lon: 126.9423, name: '서울특별시 서대문구 신촌동', type: '행정동', admin_parent: '서울특별시 서대문구', legal_divisions: ['신촌동', '창천동', '대현동', '봉원동'], aliases: ['신촌'] });

    // 마포구
    addLocation('마포구', { lat: 37.5615, lon: 126.9088, name: '서울특별시 마포구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('공덕동', { lat: 37.5450, lon: 126.9520, name: '서울특별시 마포구 공덕동', type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['공덕동'] });
    addLocation('아현동', { lat: 37.5580, lon: 126.9520, name: '서울특별시 마포구 아현동', type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['아현동'] });
    addLocation('도화동', { lat: 37.5400, lon: 126.9490, name: '서울특별시 마포구 도화동', type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['도화동'] });
    addLocation('용강동', { lat: 37.5350, lon: 126.9400, name: '서울특별시 마포구 용강동', type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['용강동'] });
    addLocation('대흥동', { lat: 37.5500, lon: 126.9420, name: '서울특별시 마포구 대흥동', type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['대흥동'] });
    addLocation('염리동', { lat: 37.5520, lon: 126.9490, name: '서울특별시 마포구 염리동', type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['염리동'] });
    addLocation('신수동', { lat: 37.5480, lon: 126.9300, name: '서울특별시 마포구 신수동', type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['신수동'] });
    addLocation('서교동', { lat: 37.5577, lon: 126.9248, name: '서울특별시 마포구 서교동', type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['서교동', '동교동', '합정동'], aliases: ['홍대'] });
    addLocation('합정동', { lat: 37.5490, lon: 126.9140, name: '서울특별시 마포구 합정동', type: '법정동', admin_parent: '서울특별시 마포구' });
    addLocation('망원1동', { lat: 37.5600, lon: 126.9030, name: '서울특별시 마포구 망원1동', type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['망원동'] });
    addLocation('연남동', { lat: 37.5610, lon: 126.9260, name: '서울특별시 마포구 연남동', type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['연남동'] });
    addLocation('상암동', { lat: 37.5770, lon: 126.8900, name: '서울특별시 마포구 상암동', type: '행정동', admin_parent: '서울특별시 마포구', legal_divisions: ['상암동'] });

    // 양천구
    addLocation('양천구', { lat: 37.5173, lon: 126.8665, name: '서울특별시 양천구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('목1동', { lat: 37.5360, lon: 126.8780, name: '서울특별시 양천구 목1동', type: '행정동', admin_parent: '서울특별시 양천구', legal_divisions: ['목동'] });
    addLocation('신월1동', { lat: 37.5300, lon: 126.8370, name: '서울특별시 양천구 신월1동', type: '행정동', admin_parent: '서울특별시 양천구', legal_divisions: ['신월동'] });
    addLocation('신정1동', { lat: 37.5180, lon: 126.8680, name: '서울특별시 양천구 신정1동', type: '행정동', admin_parent: '서울특별시 양천구', legal_divisions: ['신정동'] });

    // 강서구
    addLocation('강서구', { lat: 37.5509, lon: 126.8495, name: '서울특별시 강서구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('염창동', { lat: 37.5610, lon: 126.8770, name: '서울특별시 강서구 염창동', type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['염창동'] });
    addLocation('등촌1동', { lat: 37.5600, lon: 126.8570, name: '서울특별시 강서구 등촌1동', type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['등촌동'] });
    addLocation('화곡1동', { lat: 37.5450, lon: 126.8400, name: '서울특별시 강서구 화곡1동', type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['화곡동'] });
    addLocation('가양1동', { lat: 37.5660, lon: 126.8500, name: '서울특별시 강서구 가양1동', type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['가양동'] });
    addLocation('발산1동', { lat: 37.5600, lon: 126.8200, name: '서울특별시 강서구 발산1동', type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['발산동'] });
    addLocation('공항동', { lat: 37.5600, lon: 126.7940, name: '서울특별시 강서구 공항동', type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['공항동'] });
    addLocation('방화1동', { lat: 37.5700, lon: 126.8000, name: '서울특별시 강서구 방화1동', type: '행정동', admin_parent: '서울특별시 강서구', legal_divisions: ['방화동'] });

    // 구로구
    addLocation('구로구', { lat: 37.4954, lon: 126.8874, name: '서울특별시 구로구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('신도림동', { lat: 37.5060, lon: 126.8910, name: '서울특별시 구로구 신도림동', type: '행정동', admin_parent: '서울특별시 구로구', legal_divisions: ['신도림동'] });
    addLocation('구로1동', { lat: 37.4960, lon: 126.8850, name: '서울특별시 구로구 구로1동', type: '행정동', admin_parent: '서울특별시 구로구', legal_divisions: ['구로동'] });
    addLocation('고척1동', { lat: 37.5010, lon: 126.8650, name: '서울특별시 구로구 고척1동', type: '행정동', admin_parent: '서울특별시 구로구', legal_divisions: ['고척동'] });
    addLocation('개봉1동', { lat: 37.4870, lon: 126.8580, name: '서울특별시 구로구 개봉1동', type: '행정동', admin_parent: '서울특별시 구로구', legal_divisions: ['개봉동'] });
    addLocation('오류1동', { lat: 37.4870, lon: 126.8370, name: '서울특별시 구로구 오류1동', type: '행정동', admin_parent: '서울특별시 구로구', legal_divisions: ['오류동'] });
    addLocation('가리봉동', { lat: 37.4820, lon: 126.8820, name: '서울특별시 구로구 가리봉동', type: '행정동', admin_parent: '서울특별시 구로구', legal_divisions: ['가리봉동'] });

    // 금천구
    addLocation('금천구', { lat: 37.4571, lon: 126.9009, name: '서울특별시 금천구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('가산동', { lat: 37.4770, lon: 126.8800, name: '서울특별시 금천구 가산동', type: '행정동', admin_parent: '서울특별시 금천구', legal_divisions: ['가산동'] });
    addLocation('독산1동', { lat: 37.4650, lon: 126.9000, name: '서울특별시 금천구 독산1동', type: '행정동', admin_parent: '서울특별시 금천구', legal_divisions: ['독산동'] });
    addLocation('시흥1동', { lat: 37.4470, lon: 126.9140, name: '서울특별시 금천구 시흥1동', type: '행정동', admin_parent: '서울특별시 금천구', legal_divisions: ['시흥동'] });

    // 영등포구
    addLocation('영등포구', { lat: 37.5262, lon: 126.9095, name: '서울특별시 영등포구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('여의동', { lat: 37.5222, lon: 126.9242, name: '서울특별시 영등포구 여의동', type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['여의도동'], aliases: ['여의도'] });
    addLocation('당산1동', { lat: 37.5330, lon: 126.9000, name: '서울특별시 영등포구 당산1동', type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['당산동'] });
    addLocation('영등포동', { lat: 37.5180, lon: 126.9060, name: '서울특별시 영등포구 영등포동', type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['영등포동'] });
    addLocation('도림동', { lat: 37.5080, lon: 126.8960, name: '서울특별시 영등포구 도림동', type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['도림동'] });
    addLocation('신길1동', { lat: 37.5080, lon: 126.9140, name: '서울특별시 영등포구 신길1동', type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['신길동'] });
    addLocation('대림1동', { lat: 37.4900, lon: 126.9060, name: '서울특별시 영등포구 대림1동', type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['대림동'] });
    addLocation('양평1동', { lat: 37.5400, lon: 126.8970, name: '서울특별시 영등포구 양평1동', type: '행정동', admin_parent: '서울특별시 영등포구', legal_divisions: ['양평동1가', '양평동2가'] });

    // 동작구
    addLocation('동작구', { lat: 37.5124, lon: 126.9392, name: '서울특별시 동작구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('노량진1동', { lat: 37.5130, lon: 126.9400, name: '서울특별시 동작구 노량진1동', type: '행정동', admin_parent: '서울특별시 동작구', legal_divisions: ['노량진동'] });
    addLocation('상도1동', { lat: 37.5020, lon: 126.9440, name: '서울특별시 동작구 상도1동', type: '행정동', admin_parent: '서울특별시 동작구', legal_divisions: ['상도동'] });
    addLocation('흑석동', { lat: 37.5080, lon: 126.9580, name: '서울특별시 동작구 흑석동', type: '행정동', admin_parent: '서울특별시 동작구', legal_divisions: ['흑석동'] });
    addLocation('사당1동', { lat: 37.4840, lon: 126.9740, name: '서울특별시 동작구 사당1동', type: '행정동', admin_parent: '서울특별시 동작구', legal_divisions: ['사당동'] });
    addLocation('대방동', { lat: 37.5000, lon: 126.9260, name: '서울특별시 동작구 대방동', type: '행정동', admin_parent: '서울특별시 동작구', legal_divisions: ['대방동'] });
    addLocation('신대방1동', { lat: 37.4910, lon: 126.9200, name: '서울특별시 동작구 신대방1동', type: '행정동', admin_parent: '서울특별시 동작구', legal_divisions: ['신대방동'] });

    // 관악구
    addLocation('관악구', { lat: 37.4784, lon: 126.9517, name: '서울특별시 관악구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('봉천동', { lat: 37.4780, lon: 126.9530, name: '서울특별시 관악구 봉천동', type: '법정동', admin_parent: '서울특별시 관악구' });
    addLocation('신림동', { lat: 37.4830, lon: 126.9300, name: '서울특별시 관악구 신림동', type: '법정동', admin_parent: '서울특별시 관악구' });
    addLocation('남현동', { lat: 37.4700, lon: 126.9800, name: '서울특별시 관악구 남현동', type: '행정동', admin_parent: '서울특별시 관악구', legal_divisions: ['남현동'] });
    addLocation('대학동', { lat: 37.4660, lon: 126.9400, name: '서울특별시 관악구 대학동', type: '행정동', admin_parent: '서울특별시 관악구', legal_divisions: ['신림동'] });
    addLocation('조원동', { lat: 37.4710, lon: 126.9060, name: '서울특별시 관악구 조원동', type: '행정동', admin_parent: '서울특별시 관악구', legal_divisions: ['신림동'] });
    addLocation('삼성동', { lat: 37.4650, lon: 126.9250, name: '서울특별시 관악구 삼성동', type: '행정동', admin_parent: '서울특별시 관악구', legal_divisions: ['신림동'] });
    addLocation('청룡동', { lat: 37.4800, lon: 126.9540, name: '서울특별시 관악구 청룡동', type: '행정동', admin_parent: '서울특별시 관악구', legal_divisions: ['봉천동'] });
    addLocation('은천동', { lat: 37.4860, lon: 126.9400, name: '서울특별시 관악구 은천동', type: '행정동', admin_parent: '서울특별시 관악구', legal_divisions: ['봉천동'] });

    // 서초구
    addLocation('서초구', { lat: 37.4837, lon: 127.0324, name: '서울특별시 서초구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('서초1동', { lat: 37.4900, lon: 127.0170, name: '서울특별시 서초구 서초1동', type: '행정동', admin_parent: '서울특별시 서초구', legal_divisions: ['서초동'] });
    addLocation('잠원동', { lat: 37.5200, lon: 127.0180, name: '서울특별시 서초구 잠원동', type: '행정동', admin_parent: '서울특별시 서초구', legal_divisions: ['잠원동'] });
    addLocation('반포1동', { lat: 37.5020, lon: 127.0000, name: '서울특별시 서초구 반포1동', type: '행정동', admin_parent: '서울특별시 서초구', legal_divisions: ['반포동'] });
    addLocation('방배1동', { lat: 37.4830, lon: 126.9850, name: '서울특별시 서초구 방배1동', type: '행정동', admin_parent: '서울특별시 서초구', legal_divisions: ['방배동'] });
    addLocation('양재1동', { lat: 37.4600, lon: 127.0380, name: '서울특별시 서초구 양재1동', type: '행정동', admin_parent: '서울특별시 서초구', legal_divisions: ['양재동', '염곡동'] });
    addLocation('내곡동', { lat: 37.4470, lon: 127.0700, name: '서울특별시 서초구 내곡동', type: '행정동', admin_parent: '서울특별시 서초구', legal_divisions: ['내곡동', '신원동', '원지동', '염곡동'] });
    addLocation('고속터미널', { lat: 37.5050, lon: 127.0040, name: '서울특별시 서초구 반포동', type: '별칭', admin_parent: '서울특별시 서초구' });

    // 강남구
    addLocation('강남구', { lat: 37.5172, lon: 127.0473, name: '서울특별시 강남구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('신사동', { lat: 37.5200, lon: 127.0200, name: '서울특별시 강남구 신사동', type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['신사동'], aliases: ['가로수길'] });
    addLocation('논현1동', { lat: 37.5130, lon: 127.0250, name: '서울특별시 강남구 논현1동', type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['논현동'] });
    addLocation('압구정동', { lat: 37.5270, lon: 127.0290, name: '서울특별시 강남구 압구정동', type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['압구정동'] });
    addLocation('청담동', { lat: 37.5220, lon: 127.0500, name: '서울특별시 강남구 청담동', type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['청담동'] });
    addLocation('삼성1동', { lat: 37.5140, lon: 127.0560, name: '서울특별시 강남구 삼성1동', type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['삼성동'], aliases: ['코엑스'] });
    addLocation('대치1동', { lat: 37.4990, lon: 127.0580, name: '서울특별시 강남구 대치1동', type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['대치동'] });
    addLocation('역삼1동', { lat: 37.5000, lon: 127.0360, name: '서울특별시 강남구 역삼1동', type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['역삼동'], aliases: ['강남역', '강남'] });
    addLocation('도곡1동', { lat: 37.4900, lon: 127.0450, name: '서울특별시 강남구 도곡1동', type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['도곡동'] });
    addLocation('개포1동', { lat: 37.4760, lon: 127.0540, name: '서울특별시 강남구 개포1동', type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['개포동'] });
    addLocation('세곡동', { lat: 37.4660, lon: 127.1000, name: '서울특별시 강남구 세곡동', type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['세곡동', '자곡동', '율현동'] });
    addLocation('일원1동', { lat: 37.4850, lon: 127.0800, name: '서울특별시 강남구 일원1동', type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['일원동'] });
    addLocation('수서동', { lat: 37.4870, lon: 127.1000, name: '서울특별시 강남구 수서동', type: '행정동', admin_parent: '서울특별시 강남구', legal_divisions: ['수서동'] });

    // 송파구
    addLocation('송파구', { lat: 37.5145, lon: 127.1054, name: '서울특별시 송파구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('잠실본동', { lat: 37.5080, lon: 127.0850, name: '서울특별시 송파구 잠실본동', type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'], aliases: ['잠실'] });
    addLocation('잠실2동', { lat: 37.5130, lon: 127.0860, name: '서울특별시 송파구 잠실2동', type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'] });
    addLocation('잠실3동', { lat: 37.5100, lon: 127.0900, name: '서울특별시 송파구 잠실3동', type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'] });
    addLocation('잠실7동', { lat: 37.5200, lon: 127.1000, name: '서울특별시 송파구 잠실7동', type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'] });
    addLocation('잠실4동', { lat: 37.5160, lon: 127.0800, name: '서울특별시 송파구 잠실4동', type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'] });
    addLocation('잠실5동', { lat: 37.5140, lon: 127.0820, name: '서울특별시 송파구 잠실5동', type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'] });
    addLocation('잠실6동', { lat: 37.5130, lon: 127.0990, name: '서울특별시 송파구 잠실6동', type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['잠실동'] });
    addLocation('신천동', { lat: 37.5130, lon: 127.1000, name: '서울특별시 송파구 신천동', type: '법정동', admin_parent: '서울특별시 송파구' });
    addLocation('방이1동', { lat: 37.5150, lon: 127.1250, name: '서울특별시 송파구 방이1동', type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['방이동'] });
    addLocation('오륜동', { lat: 37.5140, lon: 127.1360, name: '서울특별시 송파구 오륜동', type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['오륜동'] });
    addLocation('송파1동', { lat: 37.5020, lon: 127.1080, name: '서울특별시 송파구 송파1동', type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['송파동'] });
    addLocation('석촌동', { lat: 37.5030, lon: 127.0990, name: '서울특별시 송파구 석촌동', type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['석촌동'] });
    addLocation('삼전동', { lat: 37.5070, lon: 127.0820, name: '서울특별시 송파구 삼전동', type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['삼전동'] });
    addLocation('가락1동', { lat: 37.4950, lon: 127.1120, name: '서울특별시 송파구 가락1동', type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['가락동'] });
    addLocation('문정1동', { lat: 37.4870, lon: 127.1160, name: '서울특별시 송파구 문정1동', type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['문정동'] });
    addLocation('장지동', { lat: 37.4780, lon: 127.1280, name: '서울특별시 송파구 장지동', type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['장지동', '복정동'] });
    addLocation('위례동', { lat: 37.4850, lon: 127.1430, name: '서울특별시 송파구 위례동', type: '행정동', admin_parent: '서울특별시 송파구', legal_divisions: ['장지동', '거여동'] }); // 위례신도시 송파구 관할

    // 강동구
    addLocation('강동구', { lat: 37.5298, lon: 127.1269, name: '서울특별시 강동구', type: '기초자치단체', admin_parent: '서울특별시' });
    addLocation('명일1동', { lat: 37.5500, lon: 127.1400, name: '서울특별시 강동구 명일1동', type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['명일동'] });
    addLocation('고덕1동', { lat: 37.5580, lon: 127.1480, name: '서울특별시 강동구 고덕1동', type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['고덕동'] });
    addLocation('암사1동', { lat: 37.5540, lon: 127.1280, name: '서울특별시 강동구 암사1동', type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['암사동'] });
    addLocation('천호1동', { lat: 37.5380, lon: 127.1200, name: '서울특별시 강동구 천호1동', type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['천호동'] });
    addLocation('성내1동', { lat: 37.5300, lon: 127.1200, name: '서울특별시 강동구 성내1동', type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['성내동'] });
    addLocation('둔촌1동', { lat: 37.5200, lon: 127.1450, name: '서울특별시 강동구 둔촌1동', type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['둔촌동'] });
    addLocation('길동', { lat: 37.5370, lon: 127.1370, name: '서울특별시 강동구 길동', type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['길동'] });
    addLocation('상일동', { lat: 37.5500, lon: 127.1600, name: '서울특별시 강동구 상일동', type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['상일동'] });
    addLocation('강일동', { lat: 37.5670, lon: 127.1700, name: '서울특별시 강동구 강일동', type: '행정동', admin_parent: '서울특별시 강동구', legal_divisions: ['강일동'] });

    

// 부산광역시 (광역시)
addLocation('부산광역시', {
    lat: 35.1770194444444, lon: 129.076952777777, name: '부산광역시', type: '광역시', admin_parent: '',
    legal_divisions: [], aliases: [], priority_score: priorityMap['부산광역시']
});

// 부산광역시 중구 (기초자치단체)
addLocation('중구', {
    lat: 35.1032166666666, lon: 129.034508333333, name: '부산광역시 중구', type: '기초자치단체', admin_parent: '부산광역시',
    legal_divisions: ['중앙동1가', '중앙동2가', '중앙동3가', '중앙동4가', '중앙동5가', '중앙동6가', '중앙동7가',
                     '동광동1가', '동광동2가', '동광동3가', '동광동4가', '동광동5가',
                     '대청동1가', '대청동2가', '대청동3가', '대청동4가',
                     '보수동1가', '보수동2가', '보수동3가',
                     '부평동1가', '부평동2가', '부평동3가', '부평동4가',
                     '광복동1가', '광복동2가', '광복동3가',
                     '남포동1가', '남포동2가', '남포동3가', '남포동4가', '남포동5가', '남포동6가',
                     '영주동', '동광동'], aliases: [], priority_score: priorityMap['중구']
});
// 부산광역시 중구 행정동
addLocation('중앙동', {
    lat: 35.0981861111111, lon: 129.037588888888, name: '부산광역시 중구 중앙동', type: '행정동', admin_parent: '부산광역시 중구',
    legal_divisions: ['중앙동1가', '중앙동2가', '중앙동3가', '중앙동4가', '중앙동5가', '중앙동6가', '중앙동7가'], aliases: [], priority_score: priorityMap['중앙동']
});
addLocation('동광동', {
    lat: 35.1019333333333, lon: 129.036877777777, name: '부산광역시 중구 동광동', type: '행정동', admin_parent: '부산광역시 중구',
    legal_divisions: ['동광동1가', '동광동2가', '동광동3가', '동광동4가', '동광동5가'], aliases: [], priority_score: priorityMap['동광동']
});
addLocation('대청동', {
    lat: 35.1011472222222, lon: 129.033333333333, name: '부산광역시 중구 대청동', type: '행정동', admin_parent: '부산광역시 중구',
    legal_divisions: ['대청동1가', '대청동2가', '대청동3가', '대청동4가'], aliases: [], priority_score: priorityMap['대청동']
});
addLocation('보수동', {
    lat: 35.1007027777777, lon: 129.027622222222, name: '부산광역시 중구 보수동', type: '행정동', admin_parent: '부산광역시 중구',
    legal_divisions: ['보수동1가', '보수동2가', '보수동3가'], aliases: [], priority_score: priorityMap['보수동']
});
addLocation('부평동', {
    lat: 35.0972972222222, lon: 129.028797222222, name: '부산광역시 중구 부평동', type: '행정동', admin_parent: '부산광역시 중구',
    legal_divisions: ['부평동1가', '부평동2가', '부평동3가', '부평동4가'], aliases: [], priority_score: priorityMap['부평동']
});
addLocation('광복동', {
    lat: 35.0968583333333, lon: 129.032752777777, name: '부산광역시 중구 광복동', type: '행정동', admin_parent: '부산광역시 중구',
    legal_divisions: ['광복동1가', '광복동2가', '광복동3가'], aliases: [], priority_score: priorityMap['광복동']
});
addLocation('남포동', {
    lat: 35.0943055555555, lon: 129.034086111111, name: '부산광역시 중구 남포동', type: '행정동', admin_parent: '부산광역시 중구',
    legal_divisions: ['남포동1가', '남포동2가', '남포동3가', '남포동4가', '남포동5가', '남포동6가'], aliases: ['남포동'], priority_score: priorityMap['남포동']
});
addLocation('영주제1동', {
    lat: 35.1080472222222, lon: 129.037286111111, name: '부산광역시 중구 영주제1동', type: '행정동', admin_parent: '부산광역시 중구',
    legal_divisions: ['영주동'], aliases: [], priority_score: priorityMap['영주제1동']
});
addLocation('영주제2동', {
    lat: 35.1085083333333, lon: 129.034033333333, name: '부산광역시 중구 영주제2동', type: '행정동', admin_parent: '부산광역시 중구',
    legal_divisions: ['영주동'], aliases: [], priority_score: priorityMap['영주제2동']
});

// 부산광역시 서구 (기초자치단체)
addLocation('서구', {
    lat: 35.0948361111111, lon: 129.026377777777, name: '부산광역시 서구', type: '기초자치단체', admin_parent: '부산광역시',
    legal_divisions: ['동대신동', '서대신동', '부민동', '아미동', '초장동', '충무동', '남부민동', '암남동'], aliases: ['서구'], priority_score: priorityMap['서구']
});
// 부산광역시 서구 행정동
addLocation('동대신제1동', {
    lat: 35.1065361111111, lon: 129.022508333333, name: '부산광역시 서구 동대신제1동', type: '행정동', admin_parent: '부산광역시 서구',
    legal_divisions: ['동대신동'], aliases: [], priority_score: priorityMap['동대신제1동']
});
addLocation('동대신제2동', {
    lat: 35.1098527777777, lon: 129.025430555555, name: '부산광역시 서구 동대신제2동', type: '행정동', admin_parent: '부산광역시 서구',
    legal_divisions: ['동대신동'], aliases: [], priority_score: priorityMap['동대신제2동']
});
addLocation('동대신제3동', {
    lat: 35.1113388888888, lon: 129.019508333333, name: '부산광역시 서구 동대신제3동', type: '행정동', admin_parent: '부산광역시 서구',
    legal_divisions: ['동대신동'], aliases: [], priority_score: priorityMap['동대신제3동']
});
addLocation('서대신제1동', {
    lat: 35.1080138888888, lon: 129.016675, name: '부산광역시 서구 서대신제1동', type: '행정동', admin_parent: '부산광역시 서구',
    legal_divisions: ['서대신동'], aliases: [], priority_score: priorityMap['동대신제1동'] // Changed to 서대신제1동
});
addLocation('서대신제3동', {
    lat: 35.1103666666666, lon: 129.014188888888, name: '부산광역시 서구 서대신제3동', type: '행정동', admin_parent: '부산광역시 서구',
    legal_divisions: ['서대신동'], aliases: [], priority_score: priorityMap['서대신제3동'] // Changed to 서대신제3동
});
addLocation('서대신제4동', {
    lat: 35.1160722222222, lon: 129.014833333333, name: '부산광역시 서구 서대신제4동', type: '행정동', admin_parent: '부산광역시 서구',
    legal_divisions: ['서대신동'], aliases: [], priority_score: priorityMap['서대신제4동'] // Changed to 서대신제4동
});
addLocation('부민동', {
    lat: 35.1006861111111, lon: 129.020752777777, name: '부산광역시 서구 부민동', type: '행정동', admin_parent: '부산광역시 서구',
    legal_divisions: ['부민동'], aliases: [], priority_score: priorityMap['부민동']
});
addLocation('아미동', {
    lat: 35.0970888888888, lon: 129.017686111111, name: '부산광역시 서구 아미동', type: '행정동', admin_parent: '부산광역시 서구',
    legal_divisions: ['아미동'], aliases: [], priority_score: priorityMap['아미동']
});
addLocation('초장동', {
    lat: 35.0928777777777, lon: 129.022563888888, name: '부산광역시 서구 초장동', type: '행정동', admin_parent: '부산광역시 서구',
    legal_divisions: ['초장동'], aliases: [], priority_score: priorityMap['초장동']
});
addLocation('충무동', {
    lat: 35.0949361111111, lon: 129.023897222222, name: '부산광역시 서구 충무동', type: '행정동', admin_parent: '부산광역시 서구',
    legal_divisions: ['충무동'], aliases: [], priority_score: priorityMap['충무동']
});
addLocation('남부민제1동', {
    lat: 35.0896583333333, lon: 129.025563888888, name: '부산광역시 서구 남부민제1동', type: '행정동', admin_parent: '부산광역시 서구',
    legal_divisions: ['남부민동'], aliases: [], priority_score: priorityMap['남부민제1동']
});
addLocation('남부민제2동', {
    lat: 35.08155, lon: 129.021863888888, name: '부산광역시 서구 남부민제2동', type: '행정동', admin_parent: '부산광역시 서구',
    legal_divisions: ['남부민동'], aliases: [], priority_score: priorityMap['남부민제2동']
});
addLocation('암남동', {
    lat: 35.0769055555555, lon: 129.0236, name: '부산광역시 서구 암남동', type: '행정동', admin_parent: '부산광역시 서구',
    legal_divisions: ['암남동'], aliases: [], priority_score: priorityMap['암남동']
});

// 부산광역시 동구 (기초자치단체)
addLocation('동구', {
    lat: 35.1358944444444, lon: 129.059175, name: '부산광역시 동구', type: '기초자치단체', admin_parent: '부산광역시',
    legal_divisions: ['초량동', '수정동', '좌천동', '범일동'], aliases: ['동구'], priority_score: priorityMap['동구']
});
// 부산광역시 동구 행정동
addLocation('초량제1동', {
    lat: 35.1108777777777, lon: 129.039188888888, name: '부산광역시 동구 초량제1동', type: '행정동', admin_parent: '부산광역시 동구',
    legal_divisions: ['초량동'], aliases: [], priority_score: priorityMap['초량제1동']
});
addLocation('초량제2동', {
    lat: 35.1134472222222, lon: 129.0408, name: '부산광역시 동구 초량제2동', type: '행정동', admin_parent: '부산광역시 동구',
    legal_divisions: ['초량동'], aliases: [], priority_score: priorityMap['초량제2동']
});
addLocation('초량제3동', {
    lat: 35.1181861111111, lon: 129.042066666666, name: '부산광역시 동구 초량제3동', type: '행정동', admin_parent: '부산광역시 동구',
    legal_divisions: ['초량동'], aliases: [], priority_score: priorityMap['초량제3동']
});
addLocation('초량제6동', {
    lat: 35.1229083333333, lon: 129.036744444444, name: '부산광역시 동구 초량제6동', type: '행정동', admin_parent: '부산광역시 동구',
    legal_divisions: ['초량동'], aliases: [], priority_score: priorityMap['초량제6동']
});
addLocation('수정제1동', {
    lat: 35.122275, lon: 129.044533333333, name: '부산광역시 동구 수정제1동', type: '행정동', admin_parent: '부산광역시 동구',
    legal_divisions: ['수정동'], aliases: [], priority_score: priorityMap['수정제1동']
});
addLocation('수정제2동', {
    lat: 35.1252527777777, lon: 129.047263888888, name: '부산광역시 동구 수정제2동', type: '행정동', admin_parent: '부산광역시 동구',
    legal_divisions: ['수정동'], aliases: [], priority_score: priorityMap['수정제2동']
});
addLocation('수정제4동', {
    lat: 35.1239972222222, lon: 129.042963888888, name: '부산광역시 동구 수정제4동', type: '행정동', admin_parent: '부산광역시 동구',
    legal_divisions: ['수정동'], aliases: [], priority_score: priorityMap['수정제4동']
});
addLocation('수정제5동', {
    lat: 35.1307333333333, lon: 129.044688888888, name: '부산광역시 동구 수정제5동', type: '행정동', admin_parent: '부산광역시 동구',
    legal_divisions: ['수정동'], aliases: [], priority_score: priorityMap['수정제5동']
});
addLocation('좌천동', {
    lat: 35.1319861111111, lon: 129.052791666667, name: '부산광역시 동구 좌천동', type: '행정동', admin_parent: '부산광역시 동구',
    legal_divisions: ['좌천동'], aliases: [], priority_score: priorityMap['좌천동']
});
addLocation('범일제1동', {
    lat: 35.1362722222222, lon: 129.058308333333, name: '부산광역시 동구 범일제1동', type: '행정동', admin_parent: '부산광역시 동구',
    legal_divisions: ['범일동'], aliases: [], priority_score: priorityMap['범일제1동']
});
addLocation('범일제2동', {
    lat: 35.1318722222222, lon: 129.061986111111, name: '부산광역시 동구 범일제2동', type: '행정동', admin_parent: '부산광역시 동구',
    legal_divisions: ['범일동'], aliases: [], priority_score: priorityMap['범일제2동']
});
addLocation('범일제5동', {
    lat: 35.1273055555555, lon: 129.056019444444, name: '부산광역시 동구 범일제5동', type: '행정동', admin_parent: '부산광역시 동구',
    legal_divisions: ['범일동'], aliases: [], priority_score: priorityMap['범일제5동']
});

// 부산광역시 영도구 (기초자치단체)
addLocation('영도구', {
    lat: 35.0881166666666, lon: 129.070186111111, name: '부산광역시 영도구', type: '기초자치단체', admin_parent: '부산광역시',
    legal_divisions: ['남항동', '영선동', '신선동', '봉래동', '청학동', '동삼동'], aliases: ['영도구'], priority_score: priorityMap['영도구']
});
// 부산광역시 영도구 행정동
addLocation('남항동', {
    lat: 35.0867888888888, lon: 129.039852777777, name: '부산광역시 영도구 남항동', type: '행정동', admin_parent: '부산광역시 영도구',
    legal_divisions: ['남항동'], aliases: [], priority_score: priorityMap['남항동']
});
addLocation('영선제1동', {
    lat: 35.0871611111111, lon: 129.047033333333, name: '부산광역시 영도구 영선제1동', type: '행정동', admin_parent: '부산광역시 영도구',
    legal_divisions: ['영선동'], aliases: [], priority_score: priorityMap['영선제1동']
});
addLocation('영선제2동', {
    lat: 35.08385, lon: 129.043641666666, name: '부산광역시 영도구 영선제2동', type: '행정동', admin_parent: '부산광역시 영도구',
    legal_divisions: ['영선동'], aliases: [], priority_score: priorityMap['영선제2동']
});
addLocation('신선동', {
    lat: 35.0802444444444, lon: 129.047455555555, name: '부산광역시 영도구 신선동', type: '행정동', admin_parent: '부산광역시 영도구',
    legal_divisions: ['신선동'], aliases: [], priority_score: priorityMap['신선동']
});
addLocation('봉래제1동', {
    lat: 35.0903916666666, lon: 129.046622222222, name: '부산광역시 영도구 봉래제1동', type: '행정동', admin_parent: '부산광역시 영도구',
    legal_divisions: ['봉래동'], aliases: [], priority_score: priorityMap['봉래제1동']
});
addLocation('봉래제2동', {
    lat: 35.0911083333333, lon: 129.048397222222, name: '부산광역시 영도구 봉래제2동', type: '행정동', admin_parent: '부산광역시 영도구',
    legal_divisions: ['봉래동'], aliases: [], priority_score: priorityMap['봉래제2동']
});
addLocation('청학제1동', {
    lat: 35.0938333333333, lon: 129.060686111111, name: '부산광역시 영도구 청학제1동', type: '행정동', admin_parent: '부산광역시 영도구',
    legal_divisions: ['청학동'], aliases: [], priority_score: priorityMap['청학제1동']
});
addLocation('청학제2동', {
    lat: 35.088825, lon: 129.068030555555, name: '부산광역시 영도구 청학제2동', type: '행정동', admin_parent: '부산광역시 영도구',
    legal_divisions: ['청학동'], aliases: [], priority_score: priorityMap['청학제2동']
});
addLocation('동삼제1동', {
    lat: 35.0717944444444, lon: 129.070708333333, name: '부산광역시 영도구 동삼제1동', type: '행정동', admin_parent: '부산광역시 영도구',
    legal_divisions: ['동삼동'], aliases: [], priority_score: priorityMap['동삼제1동']
});
addLocation('동삼제2동', {
    lat: 35.0647416666666, lon: 129.082922222222, name: '부산광역시 영도구 동삼제2동', type: '행정동', admin_parent: '부산광역시 영도구',
    legal_divisions: ['동삼동'], aliases: [], priority_score: priorityMap['동삼제2동']
});
addLocation('동삼제3동', {
    lat: 35.0815805555555, lon: 129.070922222222, name: '부산광역시 영도구 동삼제3동', type: '행정동', admin_parent: '부산광역시 영도구',
    legal_divisions: ['동삼동'], aliases: [], priority_score: priorityMap['동삼제3동']
});

// 부산광역시 부산진구 (기초자치단체)
addLocation('부산진구', {
    lat: 35.1599527777777, lon: 129.055319444444, name: '부산광역시 부산진구', type: '기초자치단체', admin_parent: '부산광역시',
    legal_divisions: ['부전동', '연지동', '초읍동', '양정동', '전포동', '부암동', '당감동', '가야동', '개금동', '범천동'], aliases: ['부산진구'], priority_score: priorityMap['부산진구']
});
// 부산광역시 부산진구 행정동
addLocation('부전제1동', {
    lat: 35.1572583333333, lon: 129.060922222222, name: '부산광역시 부산진구 부전제1동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['부전동'], aliases: [], priority_score: priorityMap['부전제1동']
});
addLocation('부전제2동', {
    lat: 35.1495222222222, lon: 129.059075, name: '부산광역시 부산진구 부전제2동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['부전동'], aliases: [], priority_score: priorityMap['부전제2동']
});
addLocation('연지동', {
    lat: 35.1697138888888, lon: 129.055008333333, name: '부산광역시 부산진구 연지동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['연지동'], aliases: [], priority_score: priorityMap['연지동']
});
addLocation('초읍동', {
    lat: 35.175625, lon: 129.049833333333, name: '부산광역시 부산진구 초읍동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['초읍동'], aliases: [], priority_score: priorityMap['초읍동']
});
addLocation('양정제1동', {
    lat: 35.1713972222222, lon: 129.066655555555, name: '부산광역시 부산진구 양정제1동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['양정동'], aliases: [], priority_score: priorityMap['양정제1동']
});
addLocation('양정제2동', {
    lat: 35.1697805555555, lon: 129.077988888888, name: '부산광역시 부산진구 양정제2동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['양정동'], aliases: [], priority_score: priorityMap['양정제2동']
});
addLocation('전포제1동', {
    lat: 35.1512694444444, lon: 129.069622222222, name: '부산광역시 부산진구 전포제1동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['전포동'], aliases: [], priority_score: priorityMap['전포제1동']
});
addLocation('전포제2동', {
    lat: 35.1586305555555, lon: 129.068444444444, name: '부산광역시 부산진구 전포제2동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['전포동'], aliases: [], priority_score: priorityMap['전포제2동']
});
addLocation('부암제1동', {
    lat: 35.1604611111111, lon: 129.051777777777, name: '부산광역시 부산진구 부암제1동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['부암동'], aliases: [], priority_score: priorityMap['부암제1동']
});
addLocation('부암제3동', {
    lat: 35.1659222222222, lon: 129.042055555555, name: '부산광역시 부산진구 부암제3동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['부암동'], aliases: [], priority_score: priorityMap['부암제3동']
});
addLocation('당감제1동', {
    lat: 35.1597, lon: 129.042366666666, name: '부산광역시 부산진구 당감제1동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['당감동'], aliases: [], priority_score: priorityMap['당감제1동']
});
addLocation('당감제2동', {
    lat: 35.1548888888888, lon: 129.050277777777, name: '부산광역시 부산진구 당감제2동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['당감동'], aliases: [], priority_score: priorityMap['당감제2동']
});
addLocation('당감제4동', {
    lat: 35.1649138888888, lon: 129.038797222222, name: '부산광역시 부산진구 당감제4동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['당감동'], aliases: [], priority_score: priorityMap['당감제4동']
});
addLocation('가야제1동', {
    lat: 35.1519111111111, lon: 129.044052777777, name: '부산광역시 부산진구 가야제1동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['가야동'], aliases: [], priority_score: priorityMap['가야제1동']
});
addLocation('가야제2동', {
    lat: 35.1466805555555, lon: 129.031288888888, name: '부산광역시 부산진구 가야제2동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['가야동'], aliases: [], priority_score: priorityMap['가야제2동']
});
addLocation('개금제1동', {
    lat: 35.1495666666666, lon: 129.024175, name: '부산광역시 부산진구 개금제1동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['개금동'], aliases: [], priority_score: priorityMap['개금제1동']
});
addLocation('개금제2동', {
    lat: 35.1417055555555, lon: 129.021688888888, name: '부산광역시 부산진구 개금제2동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['개금동'], aliases: [], priority_score: priorityMap['개금제2동']
});
addLocation('개금제3동', {
    lat: 35.1526861111111, lon: 129.024222222222, name: '부산광역시 부산진구 개금제3동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['개금동'], aliases: [], priority_score: priorityMap['개금제3동']
});
addLocation('범천제1동', {
    lat: 35.14385, lon: 129.0633, name: '부산광역시 부산진구 범천제1동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['범천동'], aliases: [], priority_score: priorityMap['범천제1동']
});
addLocation('범천제2동', {
    lat: 35.1432777777777, lon: 129.058397222222, name: '부산광역시 부산진구 범천제2동', type: '행정동', admin_parent: '부산광역시 부산진구',
    legal_divisions: ['범천동'], aliases: [], priority_score: priorityMap['범천제2동']
});

// 부산광역시 동래구 (기초자치단체)
addLocation('동래구', {
    lat: 35.2018722222222, lon: 129.085855555555, name: '부산광역시 동래구', type: '기초자치단체', admin_parent: '부산광역시',
    legal_divisions: ['수민동', '복산동', '명륜동', '온천동', '사직동', '안락동', '명장동'], aliases: ['동래구'], priority_score: priorityMap['동래구']
});
// 부산광역시 동래구 행정동
addLocation('수민동', {
    lat: 35.192975, lon: 129.093388888888, name: '부산광역시 동래구 수민동', type: '행정동', admin_parent: '부산광역시 동래구',
    legal_divisions: ['수민동'], aliases: [], priority_score: priorityMap['수민동']
});
addLocation('복산동', {
    lat: 35.2027083333333, lon: 129.088375, name: '부산광역시 동래구 복산동', type: '행정동', admin_parent: '부산광역시 동래구',
    legal_divisions: ['복산동'], aliases: [], priority_score: priorityMap['복산동']
});
addLocation('명륜동', {
    lat: 35.2124914, lon: 129.081561, name: '부산광역시 동래구 명륜동', type: '행정동', admin_parent: '부산광역시 동래구',
    legal_divisions: ['명륜동'], aliases: [], priority_score: priorityMap['명륜동']
});
addLocation('온천제1동', {
    lat: 35.2169666666666, lon: 129.082386111111, name: '부산광역시 동래구 온천제1동', type: '행정동', admin_parent: '부산광역시 동래구',
    legal_divisions: ['온천동'], aliases: [], priority_score: priorityMap['온천제1동']
});
addLocation('온천제2동', {
    lat: 35.2048833333333, lon: 129.075252777777, name: '부산광역시 동래구 온천제2동', type: '행정동', admin_parent: '부산광역시 동래구',
    legal_divisions: ['온천동'], aliases: [], priority_score: priorityMap['온천제2동']
});
addLocation('온천제3동', {
    lat: 35.2018666666666, lon: 129.068552777777, name: '부산광역시 동래구 온천제3동', type: '행정동', admin_parent: '부산광역시 동래구',
    legal_divisions: ['온천동'], aliases: [], priority_score: priorityMap['온천제3동']
});
addLocation('사직제1동', {
    lat: 35.1959333333333, lon: 129.064344444444, name: '부산광역시 동래구 사직제1동', type: '행정동', admin_parent: '부산광역시 동래구',
    legal_divisions: ['사직동'], aliases: [], priority_score: priorityMap['사직제1동']
});
addLocation('사직제2동', {
    lat: 35.1971749999999, lon: 129.059166666666, name: '부산광역시 동래구 사직제2동', type: '행정동', admin_parent: '부산광역시 동래구',
    legal_divisions: ['사직동'], aliases: [], priority_score: priorityMap['사직제2동']
});
addLocation('사직제3동', {
    lat: 35.1963888888888, lon: 129.071722222222, name: '부산광역시 동래구 사직제3동', type: '행정동', admin_parent: '부산광역시 동래구',
    legal_divisions: ['사직동'], aliases: [], priority_score: priorityMap['사직제3동']
});
addLocation('안락제1동', {
    lat: 35.1940472222222, lon: 129.100911111111, name: '부산광역시 동래구 안락제1동', type: '행정동', admin_parent: '부산광역시 동래구',
    legal_divisions: ['안락동'], aliases: [], priority_score: priorityMap['안락제1동']
});
addLocation('안락제2동', {
    lat: 35.1946444444444, lon: 129.112311111111, name: '부산광역시 동래구 안락제2동', type: '행정동', admin_parent: '부산광역시 동래구',
    legal_divisions: ['안락동'], aliases: [], priority_score: priorityMap['안락제2동']
});
addLocation('명장제1동', {
    lat: 35.2015805555555, lon: 129.106499999999, name: '부산광역시 동래구 명장제1동', type: '행정동', admin_parent: '부산광역시 동래구',
    legal_divisions: ['명장동'], aliases: [], priority_score: priorityMap['명장제1동']
});
addLocation('명장제2동', {
    lat: 35.2048666666666, lon: 129.104655555555, name: '부산광역시 동래구 명장제2동', type: '행정동', admin_parent: '부산광역시 동래구',
    legal_divisions: ['명장동'], aliases: [], priority_score: priorityMap['명장제2동']
});

// 부산광역시 남구 (기초자치단체)
addLocation('남구', {
    lat: 35.1334083333333, lon: 129.0865, name: '부산광역시 남구', type: '기초자치단체', admin_parent: '부산광역시',
    legal_divisions: ['대연동', '용호동', '용당동', '감만동', '우암동', '문현동'], aliases: ['남구'], priority_score: priorityMap['남구']
});
// 부산광역시 남구 행정동
addLocation('대연제1동', {
    lat: 35.1314638888888, lon: 129.095719444444, name: '부산광역시 남구 대연제1동', type: '행정동', admin_parent: '부산광역시 남구',
    legal_divisions: ['대연동'], aliases: [], priority_score: priorityMap['대연제1동']
});
addLocation('대연제3동', {
    lat: 35.1316361111111, lon: 129.102577777777, name: '부산광역시 남구 대연제3동', type: '행정동', admin_parent: '부산광역시 남구',
    legal_divisions: ['대연동'], aliases: [], priority_score: priorityMap['대연제3동']
});
addLocation('대연제4동', {
    lat: 35.1267111111111, lon: 129.093619444444, name: '부산광역시 남구 대연제4동', type: '행정동', admin_parent: '부산광역시 남구',
    legal_divisions: ['대연동'], aliases: [], priority_score: priorityMap['대연제4동']
});
addLocation('대연제5동', {
    lat: 35.1353694444444, lon: 129.092488888888, name: '부산광역시 남구 대연제5동', type: '행정동', admin_parent: '부산광역시 남구',
    legal_divisions: ['대연동'], aliases: [], priority_score: priorityMap['대연제5동']
});
addLocation('대연제6동', {
    lat: 35.1318666666666, lon: 129.085841666666, name: '부산광역시 남구 대연제6동', type: '행정동', admin_parent: '부산광역시 남구',
    legal_divisions: ['대연동'], aliases: [], priority_score: priorityMap['대연제6동']
});
addLocation('용호제1동', {
    lat: 35.1177138888888, lon: 129.111297222222, name: '부산광역시 남구 용호제1동', type: '행정동', admin_parent: '부산광역시 남구',
    legal_divisions: ['용호동'], aliases: [], priority_score: priorityMap['용호제1동']
});
addLocation('용호제2동', {
    lat: 35.11175, lon: 129.115686111111, name: '부산광역시 남구 용호제2동', type: '행정동', admin_parent: '부산광역시 남구',
    legal_divisions: ['용호동'], aliases: [], priority_score: priorityMap[' 용호제2동']
});
addLocation('용호제3동', {
    lat: 35.1179222222222, lon: 129.115063888888, name: '부산광역시 남구 용호제3동', type: '행정동', admin_parent: '부산광역시 남구',
    legal_divisions: ['용호동'], aliases: [], priority_score: priorityMap['용호제3동']
});
addLocation('용호제4동', {
    lat: 35.1101444444444, lon: 129.112663888888, name: '부산광역시 남구 용호제4동', type: '행정동', admin_parent: '부산광역시 남구',
    legal_divisions: ['용호동'], aliases: [], priority_score: priorityMap['용호제4동']
});
addLocation('용당동', {
    lat: 35.1144111111111, lon: 129.097455555555, name: '부산광역시 남구 용당동', type: '행정동', admin_parent: '부산광역시 남구',
    legal_divisions: ['용당동'], aliases: [], priority_score: priorityMap['용당동']
});
addLocation('감만제1동', {
    lat: 35.1137888888888, lon: 129.082888888888, name: '부산광역시 남구 감만제1동', type: '행정동', admin_parent: '부산광역시 남구',
    legal_divisions: ['감만동'], aliases: [], priority_score: priorityMap['감만제1동']
});
addLocation('감만제2동', {
    lat: 35.1194583333333, lon: 129.086777777777, name: '부산광역시 남구 감만제2동', type: '행정동', admin_parent: '부산광역시 남구',
    legal_divisions: ['감만동'], aliases: [], priority_score: priorityMap['감만제2동']
});
addLocation('우암동', {
    lat: 35.12499999, lon: 129.0758507, name: '부산광역시 남구 우암동', type: '행정동', admin_parent: '부산광역시 남구',
    legal_divisions: ['우암동'], aliases: [], priority_score: priorityMap['우암동']
});
addLocation('문현제1동', {
    lat: 35.1393944444444, lon: 129.073577777777, name: '부산광역시 남구 문현제1동', type: '행정동', admin_parent: '부산광역시 남구',
    legal_divisions: ['문현동'], aliases: [], priority_score: priorityMap['문현제1동']
});
addLocation('문현제2동', {
    lat: 35.1422222222222, lon: 129.070997222222, name: '부산광역시 남구 문현제2동', type: '행정동', admin_parent: '부산광역시 남구',
    legal_divisions: ['문현동'], aliases: [], priority_score: priorityMap['문현제2동']
});
addLocation('문현제3동', {
    lat: 35.1351222222222, lon: 129.073919444444, name: '부산광역시 남구 문현제3동', type: '행정동', admin_parent: '부산광역시 남구',
    legal_divisions: ['문현동'], aliases: [], priority_score: priorityMap['문현제3동']
});
addLocation('문현제4동', {
    lat: 35.1330305555555, lon: 129.0712, name: '부산광역시 남구 문현제4동', type: '행정동', admin_parent: '부산광역시 남구',
    legal_divisions: ['문현동'], aliases: [], priority_score: priorityMap['문현제4동']
});

// 부산광역시 북구 (기초자치단체)
addLocation('북구', {
    lat: 35.1941805555555, lon: 128.992474999999, name: '부산광역시 북구', type: '기초자치단체', admin_parent: '부산광역시',
    legal_divisions: ['구포동', '금곡동', '화명동', '덕천동', '만덕동'], aliases: ['북구'], priority_score: priorityMap['북구']
});
// 부산광역시 북구 행정동
addLocation('구포제1동', {
    lat: 35.2033694444444, lon: 129.003411111111, name: '부산광역시 북구 구포제1동', type: '행정동', admin_parent: '부산광역시 북구',
    legal_divisions: ['구포동'], aliases: [], priority_score: priorityMap['구포제1동']
});
addLocation('구포제2동', {
    lat: 35.1996361111111, lon: 129.000244444444, name: '부산광역시 북구 구포제2동', type: '행정동', admin_parent: '부산광역시 북구',
    legal_divisions: ['구포동'], aliases: [], priority_score: priorityMap['구포제2동']
});
addLocation('구포제3동', {
    lat: 35.1917583333333, lon: 129.011044444444, name: '부산광역시 북구 구포제3동', type: '행정동', admin_parent: '부산광역시 북구',
    legal_divisions: ['구포동'], aliases: [], priority_score: priorityMap['구포제3동']
});
addLocation('금곡동', {
    lat: 35.2470055555555, lon: 129.015088888888, name: '부산광역시 북구 금곡동', type: '행정동', admin_parent: '부산광역시 북구',
    legal_divisions: ['금곡동'], aliases: [], priority_score: priorityMap['금곡동']
});
addLocation('화명제1동', {
    lat: 35.2216944444444, lon: 129.012466666666, name: '부산광역시 북구 화명제1동', type: '행정동', admin_parent: '부산광역시 북구',
    legal_divisions: ['화명동'], aliases: [], priority_score: priorityMap['화명제1동']
});
addLocation('화명제2동', {
    lat: 35.240525, lon: 129.022022222222, name: '부산광역시 북구 화명제2동', type: '행정동', admin_parent: '부산광역시 북구',
    legal_divisions: ['화명동'], aliases: [], priority_score: priorityMap['화명제2동']
});
addLocation('화명제3동', {
    lat: 35.2287722222222, lon: 129.012333333333, name: '부산광역시 북구 화명제3동', type: '행정동', admin_parent: '부산광역시 북구',
    legal_divisions: ['화명동'], aliases: [], priority_score: priorityMap['화명제3동']
});
addLocation('덕천제1동', {
    lat: 35.2093888888888, lon: 129.019019444444, name: '부산광역시 북구 덕천제1동', type: '행정동', admin_parent: '부산광역시 북구',
    legal_divisions: ['덕천동'], aliases: [], priority_score: priorityMap['덕천제1동']
});
addLocation('덕천제2동', {
    lat: 35.2092666666666, lon: 129.010244444444, name: '부산광역시 북구 덕천제2동', type: '행정동', admin_parent: '부산광역시 북구',
    legal_divisions: ['덕천동'], aliases: [], priority_score: priorityMap[' 덕천제2동']
});
addLocation('덕천제3동', {
    lat: 35.2068194444444, lon: 129.019697222222, name: '부산광역시 북구 덕천제3동', type: '행정동', admin_parent: '부산광역시 북구',
    legal_divisions: ['덕천동'], aliases: [], priority_score: priorityMap['덕천제3동']
});
addLocation('만덕제1동', {
    lat: 35.2103666666666, lon: 129.038519444444, name: '부산광역시 북구 만덕제1동', type: '행정동', admin_parent: '부산광역시 북구',
    legal_divisions: ['만덕동'], aliases: [], priority_score: priorityMap['만덕제1동']
});
addLocation('만덕제2동', {
    lat: 35.2071194444444, lon: 129.039466666666, name: '부산광역시 북구 만덕제2동', type: '행정동', admin_parent: '부산광역시 북구',
    legal_divisions: ['만덕동'], aliases: [], priority_score: priorityMap['만덕제2동']
});
addLocation('만덕제3동', {
    lat: 35.2083083333333, lon: 129.031397222222, name: '부산광역시 북구 만덕제3동', type: '행정동', admin_parent: '부산광역시 북구',
    legal_divisions: ['만덕동'], aliases: [], priority_score: priorityMap['만덕제3동']
});

// 부산광역시 해운대구 (기초자치단체)
addLocation('해운대구', {
    lat: 35.1600194444444, lon: 129.165808333333, name: '부산광역시 해운대구', type: '기초자치단체', admin_parent: '부산광역시',
    legal_divisions: ['우동', '중동', '좌동', '송정동', '반여동', '반송동', '재송동'], aliases: ['해운대구', '해운대'], priority_score: priorityMap['해운대구']
});
// 부산광역시 해운대구 행정동
addLocation('우제1동', {
    lat: 35.1598111111111, lon: 129.160286111111, name: '부산광역시 해운대구 우제1동', type: '행정동', admin_parent: '부산광역시 해운대구',
    legal_divisions: ['우동'], aliases: [], priority_score: priorityMap['우제1동']
});
addLocation('우제2동', {
    lat: 35.1681555555555, lon: 129.142211111111, name: '부산광역시 해운대구 우제2동', type: '행정동', admin_parent: '부산광역시 해운대구',
    legal_divisions: ['우동'], aliases: [], priority_score: priorityMap['우제2동']
});
addLocation('우제3동', {
    lat: 35.1592915, lon: 129.1424022, name: '부산광역시 해운대구 우제3동', type: '행정동', admin_parent: '부산광역시 해운대구',
    legal_divisions: ['우동'], aliases: [], priority_score: priorityMap['우제3동']
});
addLocation('중제1동', {
    lat: 35.1594583333333, lon: 129.166477777777, name: '부산광역시 해운대구 중제1동', type: '행정동', admin_parent: '부산광역시 해운대구',
    legal_divisions: ['중동'], aliases: [], priority_score: priorityMap['중제1동']
});
addLocation('중제2동', {
    lat: 35.1587972222222, lon: 129.182108333333, name: '부산광역시 해운대구 중제2동', type: '행정동', admin_parent: '부산광역시 해운대구',
    legal_divisions: ['중동'], aliases: [], priority_score: priorityMap['중제2동']
});
addLocation('좌제1동', {
    lat: 35.1678222222222, lon: 129.176552777777, name: '부산광역시 해운대구 좌제1동', type: '행정동', admin_parent: '부산광역시 해운대구',
    legal_divisions: ['좌동'], aliases: [], priority_score: priorityMap['좌제1동']
});
addLocation('좌제2동', {
    lat: 35.1660611111111, lon: 129.184919444444, name: '부산광역시 해운대구 좌제2동', type: '행정동', admin_parent: '부산광역시 해운대구',
    legal_divisions: ['좌동'], aliases: [], priority_score: priorityMap['좌제2동']
});
addLocation('좌제3동', {
    lat: 35.1692638888888, lon: 129.168986111111, name: '부산광역시 해운대구 좌제3동', type: '행정동', admin_parent: '부산광역시 해운대구',
    legal_divisions: ['좌동'], aliases: [], priority_score: priorityMap['좌제3동']
});
addLocation('좌제4동', {
    lat: 35.1748666666666, lon: 129.178477777777, name: '부산광역시 해운대구 좌제4동', type: '행정동', admin_parent: '부산광역시 해운대구',
    legal_divisions: ['좌동'], aliases: [], priority_score: priorityMap['좌제4동']
});
addLocation('송정동', {
    lat: 35.1805611111111, lon: 129.205897222222, name: '부산광역시 해운대구 송정동', type: '행정동', admin_parent: '부산광역시 해운대구',
    legal_divisions: ['송정동'], aliases: [], priority_score: priorityMap['송정동']
});
addLocation('반여제1동', {
    lat: 35.1980555555555, lon: 129.121188888888, name: '부산광역시 해운대구 반여제1동', type: '행정동', admin_parent: '부산광역시 해운대구',
    legal_divisions: ['반여동'], aliases: [], priority_score: priorityMap['반여제1동']
});
addLocation('반여제2동', {
    lat: 35.1928305555555, lon: 129.132352777777, name: '부산광역시 해운대구 반여제2동', type: '행정동', admin_parent: '부산광역시 해운대구',
    legal_divisions: ['반여동'], aliases: [], priority_score: priorityMap['반여제2동']
});
addLocation('반여제3동', {
    lat: 35.1980055555555, lon: 129.135699999999, name: '부산광역시 해운대구 반여제3동', type: '행정동', admin_parent: '부산광역시 해운대구',
    legal_divisions: ['반여동'], aliases: [], priority_score: priorityMap['반여제3동']
});
addLocation('반여제4동', {
    lat: 35.2061027777777, lon: 129.119344444444, name: '부산광역시 해운대구 반여제4동', type: '행정동', admin_parent: '부산광역시 해운대구',
    legal_divisions: ['반여동'], aliases: [], priority_score: priorityMap['반여제4동']
});
addLocation('반송제1동', {
    lat: 35.2220527777777, lon: 129.150008333333, name: '부산광역시 해운대구 반송제1동', type: '행정동', admin_parent: '부산광역시 해운대구',
    legal_divisions: ['반송동'], aliases: [], priority_score: priorityMap['반송제1동']
});
addLocation('반송제2동', {
    lat: 35.2257638888888, lon: 129.162697222222, name: '부산광역시 해운대구 반송제2동', type: '행정동', admin_parent: '부산광역시 해운대구',
    legal_divisions: ['반송동'], aliases: [], priority_score: priorityMap['반송제2동']
});
addLocation('재송제1동', {
    lat: 35.1808638888888, lon: 129.125644444444, name: '부산광역시 해운대구 재송제1동', type: '행정동', admin_parent: '부산광역시 해운대구',
    legal_divisions: ['재송동'], aliases: [], priority_score: priorityMap['재송제1동']
});
addLocation('재송제2동', {
    lat: 35.18655, lon: 129.127719444444, name: '부산광역시 해운대구 재송제2동', type: '행정동', admin_parent: '부산광역시 해운대구',
    legal_divisions: ['재송동'], aliases: [], priority_score: priorityMap['재송제2동']
});

// 부산광역시 사하구 (기초자치단체)
addLocation('사하구', {
    lat: 35.1014277777777, lon: 128.977041666666, name: '부산광역시 사하구', type: '기초자치단체', admin_parent: '부산광역시',
    legal_divisions: ['괴정동', '당리동', '하단동', '신평동', '장림동', '다대동', '구평동', '감천동'], aliases: ['사하구'], priority_score: priorityMap['사하구']
});
// 부산광역시 사하구 행정동
addLocation('괴정제1동', {
    lat: 35.0965027777777, lon: 128.991622222222, name: '부산광역시 사하구 괴정제1동', type: '행정동', admin_parent: '부산광역시 사하구',
    legal_divisions: ['괴정동'], aliases: [], priority_score: priorityMap['괴정제1동']
});
addLocation('괴정제2동', {
    lat: 35.1004305555555, lon: 129.006275, name: '부산광역시 사하구 괴정제2동', type: '행정동', admin_parent: '부산광역시 사하구',
    legal_divisions: ['괴정동'], aliases: [], priority_score: priorityMap['괴정제2동']
});
addLocation('괴정제3동', {
    lat: 35.0972111111111, lon: 129.000422222222, name: '부산광역시 사하구 괴정제3동', type: '행정동', admin_parent: '부산광역시 사하구',
    legal_divisions: ['괴정동'], aliases: [], priority_score: priorityMap['괴정제3동']
});
addLocation('괴정제4동', {
    lat: 35.0960166666666, lon: 128.9854, name: '부산광역시 사하구 괴정제4동', type: '행정동', admin_parent: '부산광역시 사하구',
    legal_divisions: ['괴정동'], aliases: [], priority_score: priorityMap['괴정제4동']
});
addLocation('당리동', {
    lat: 35.0998444444444, lon: 128.978930555555, name: '부산광역시 사하구 당리동', type: '행정동', admin_parent: '부산광역시 사하구',
    legal_divisions: ['당리동'], aliases: [], priority_score: priorityMap['당리동']
});
addLocation('하단제1동', {
    lat: 35.1008333333333, lon: 128.966533333333, name: '부산광역시 사하구 하단제1동', type: '행정동', admin_parent: '부산광역시 사하구',
    legal_divisions: ['하단동'], aliases: [], priority_score: priorityMap['하단제1동']
});
addLocation('하단제2동', {
    lat: 35.1114333333333, lon: 128.962686111111, name: '부산광역시 사하구 하단제2동', type: '행정동', admin_parent: '부산광역시 사하구',
    legal_divisions: ['하단동'], aliases: [], priority_score: priorityMap['하단제2동']
});
addLocation('신평제1동', {
    lat: 35.0869138888888, lon: 128.976575, name: '부산광역시 사하구 신평제1동', type: '행정동', admin_parent: '부산광역시 사하구',
    legal_divisions: ['신평동'], aliases: [], priority_score: priorityMap['신평제1동']
});
addLocation('신평제2동', {
    lat: 35.0915333333333, lon: 128.961633333333, name: '부산광역시 사하구 신평제2동', type: '행정동', admin_parent: '부산광역시 사하구',
    legal_divisions: ['신평동'], aliases: [], priority_score: priorityMap['신평제2동']
});
addLocation('장림제1동', {
    lat: 35.0798194444444, lon: 128.969141666666, name: '부산광역시 사하구 장림제1동', type: '행정동', admin_parent: '부산광역시 사하구',
    legal_divisions: ['장림동'], aliases: [], priority_score: priorityMap['장림제1동']
});
addLocation('장림제2동', {
    lat: 35.0747277777777, lon: 128.974844444444, name: '부산광역시 사하구 장림제2동', type: '행정동', admin_parent: '부산광역시 사하구',
    legal_divisions: ['장림동'], aliases: [], priority_score: priorityMap['장림제2동']
});
addLocation('다대제1동', {
    lat: 35.0561027777777, lon: 128.973577777777, name: '부산광역시 사하구 다대제1동', type: '행정동', admin_parent: '부산광역시 사하구',
    legal_divisions: ['다대동'], aliases: [], priority_score: priorityMap['다대제1동']
});
addLocation('다대제2동', {
    lat: 35.0603222222222, lon: 128.984433333333, name: '부산광역시 사하구 다대제2동', type: '행정동', admin_parent: '부산광역시 사하구',
    legal_divisions: ['다대동'], aliases: [], priority_score: priorityMap['다대제2동']
});
addLocation('구평동', {
    lat: 35.0788194444444, lon: 128.990041666666, name: '부산광역시 사하구 구평동', type: '행정동', admin_parent: '부산광역시 사하구',
    legal_divisions: ['구평동'], aliases: [], priority_score: priorityMap['구평동']
});
addLocation('감천제1동', {
    lat: 35.0849055555555, lon: 129.006911111111, name: '부산광역시 사하구 감천제1동', type: '행정동', admin_parent: '부산광역시 사하구',
    legal_divisions: ['감천동'], aliases: [], priority_score: priorityMap['감천제1동']
});
addLocation('감천제2동', {
    lat: 35.091525, lon: 129.0116, name: '부산광역시 사하구 감천제2동', type: '행정동', admin_parent: '부산광역시 사하구',
    legal_divisions: ['감천동'], aliases: [], priority_score: priorityMap['감천제2동']
});

// 부산광역시 금정구 (기초자치단체)
addLocation('금정구', {
    lat: 35.2400777777777, lon: 129.094319444444, name: '부산광역시 금정구', type: '기초자치단체', admin_parent: '부산광역시',
    legal_divisions: ['서동', '금사동', '회동동', '선동', '두구동', '철마면', '노포동', '청룡동', '남산동', '구서동', '장전동', '부곡동', '금성동'], aliases: ['금정구'], priority_score: priorityMap['금정구']
});
// 부산광역시 금정구 행정동
addLocation('서제1동', {
    lat: 35.2152611111111, lon: 129.101397222222, name: '부산광역시 금정구 서제1동', type: '행정동', admin_parent: '부산광역시 금정구',
    legal_divisions: ['서동'], aliases: [], priority_score: priorityMap['서제1동']
});
addLocation('서제2동', {
    lat: 35.2097805555555, lon: 129.106933333333, name: '부산광역시 금정구 서제2동', type: '행정동', admin_parent: '부산광역시 금정구',
    legal_divisions: ['서동'], aliases: [], priority_score: priorityMap['서제2동']
});
addLocation('서제3동', {
    lat: 35.212375, lon: 129.109730555555, name: '부산광역시 금정구 서제3동', type: '행정동', admin_parent: '부산광역시 금정구',
    legal_divisions: ['서동'], aliases: [], priority_score: priorityMap['서제3동']
});
addLocation('금사회동동', {
    lat: 35.2172361111111, lon: 129.113375, name: '부산광역시 금정구 금사회동동', type: '행정동', admin_parent: '부산광역시 금정구',
    legal_divisions: ['회동동', '금사동'], aliases: [], priority_score: priorityMap['금사회동동']
});
addLocation('부곡제1동', {
    lat: 35.22135, lon: 129.0944, name: '부산광역시 금정구 부곡제1동', type: '행정동', admin_parent: '부산광역시 금정구',
    legal_divisions: ['부곡동'], aliases: [], priority_score: priorityMap['부곡제1동']
});
addLocation('부곡제2동', {
    lat: 35.2267277777777, lon: 129.095, name: '부산광역시 금정구 부곡제2동', type: '행정동', admin_parent: '부산광역시 금정구',
    legal_divisions: ['부곡동'], aliases: [], priority_score: priorityMap['부곡제2동']
});
addLocation('부곡제3동', {
    lat: 35.2374055555555, lon: 129.096133333333, name: '부산광역시 금정구 부곡제3동', type: '행정동', admin_parent: '부산광역시 금정구',
    legal_divisions: ['부곡동'], aliases: [], priority_score: priorityMap['부곡제3동']
});
addLocation('부곡제4동', {
    lat: 35.2168138888888, lon: 129.090875, name: '부산광역시 금정구 부곡제4동', type: '행정동', admin_parent: '부산광역시 금정구',
    legal_divisions: ['부곡동'], aliases: [], priority_score: priorityMap['부곡제4동']
});
addLocation('장전제1동', {
    lat: 35.2346666666666, lon: 129.087211111111, name: '부산광역시 금정구 장전제1동', type: '행정동', admin_parent: '부산광역시 금정구',
    legal_divisions: ['장전동'], aliases: [], priority_score: priorityMap['장전제1동']
});
addLocation('장전제2동', {
    lat: 35.2225305555555, lon: 129.084377777777, name: '부산광역시 금정구 장전제2동', type: '행정동', admin_parent: '부산광역시 금정구',
    legal_divisions: ['장전동'], aliases: [], priority_score: priorityMap['장전제2동']
});
addLocation('선두구동', {
    lat: 35.2952083333333, lon: 129.115597222222, name: '부산광역시 금정구 선두구동', type: '행정동', admin_parent: '부산광역시 금정구',
    legal_divisions: ['선동', '두구동'], aliases: [], priority_score: priorityMap['선두구동']
});
addLocation('청룡노포동', {
    lat: 35.27205, lon: 129.092055555555, name: '부산광역시 금정구 청룡노포동', type: '행정동', admin_parent: '부산광역시 금정구',
    legal_divisions: ['청룡동', '노포동'], aliases: [], priority_score: priorityMap['청룡노포동']
});
addLocation('남산동', {
    lat: 35.2685555555555, lon: 129.094622222222, name: '부산광역시 금정구 남산동', type: '행정동', admin_parent: '부산광역시 금정구',
    legal_divisions: ['남산동'], aliases: [], priority_score: priorityMap['남산동']
});
addLocation('구서제1동', {
    lat: 35.2419916666666, lon: 129.089230555555, name: '부산광역시 금정구 구서제1동', type: '행정동', admin_parent: '부산광역시 금정구',
    legal_divisions: ['구서동'], aliases: [], priority_score: priorityMap['구서제1동']
});
addLocation('구서제2동', {
    lat: 35.2520833333333, lon: 129.092888888888, name: '부산광역시 금정구 구서제2동', type: '행정동', admin_parent: '부산광역시 금정구',
    legal_divisions: ['구서동'], aliases: [], priority_score: priorityMap['구서제2동']
});
addLocation('금성동', {
    lat: 35.2472527777777, lon: 129.058341666666, name: '부산광역시 금정구 금성동', type: '행정동', admin_parent: '부산광역시 금정구',
    legal_divisions: ['금성동'], aliases: [], priority_score: priorityMap['금성동']
});

// 부산광역시 강서구 (기초자치단체)
addLocation('강서구', {
    lat: 35.2091638888888, lon: 128.982908333333, name: '부산광역시 강서구', type: '기초자치단체', admin_parent: '부산광역시',
    legal_divisions: ['대저동', '강동동', '명지동', '가락동', '녹산동', '천가동', '대항동', '동선동', '성북동', '눌차동', '천성동', '대항동', '동선동', '성북동', '눌차동', '천성동'], aliases: ['강서구'], priority_score: priorityMap['강서구']
});
// 부산광역시 강서구 행정동
addLocation('대저1동', {
    lat: 35.2113944444444, lon: 128.982855555555, name: '부산광역시 강서구 대저1동', type: '행정동', admin_parent: '부산광역시 강서구',
    legal_divisions: ['대저동'], aliases: [], priority_score: priorityMap['대저1동']
});
addLocation('대저2동', {
    lat: 35.1753944444444, lon: 128.9587, name: '부산광역시 강서구 대저2동', type: '행정동', admin_parent: '부산광역시 강서구',
    legal_divisions: ['대저동'], aliases: [], priority_score: priorityMap['대저2동']
});
addLocation('강동동', {
    lat: 35.2114638888888, lon: 128.937508333333, name: '부산광역시 강서구 강동동', type: '행정동', admin_parent: '부산광역시 강서구',
    legal_divisions: ['강동동'], aliases: [], priority_score: priorityMap['강동동']
});
addLocation('명지1동', {
    lat: 35.108091, lon: 128.926502, name: '부산광역시 강서구 명지1동', type: '행정동', admin_parent: '부산광역시 강서구',
    legal_divisions: ['명지동'], aliases: [], priority_score: priorityMap['명지1동']
});
addLocation('명지2동', {
    lat: 35.084587, lon: 128.899758, name: '부산광역시 강서구 명지2동', type: '행정동', admin_parent: '부산광역시 강서구',
    legal_divisions: ['명지동'], aliases: [], priority_score: priorityMap['명지2동']
});
addLocation('가락동', {
    lat: 35.1933166666666, lon: 128.904075, name: '부산광역시 강서구 가락동', type: '행정동', admin_parent: '부산광역시 강서구',
    legal_divisions: ['가락동'], aliases: [], priority_score: priorityMap['가락동']
});
addLocation('녹산동', {
    lat: 35.1234638888888, lon: 128.860808333333, name: '부산광역시 강서구 녹산동', type: '행정동', admin_parent: '부산광역시 강서구',
    legal_divisions: ['녹산동'], aliases: [], priority_score: priorityMap['녹산동']
});
addLocation('가덕도동', {
    lat: 35.0526166666667, lon: 128.814033333333, name: '부산광역시 강서구 가덕도동', type: '행정동', admin_parent: '부산광역시 강서구',
    legal_divisions: ['대항동', '동선동', '성북동', '눌차동', '천성동'], aliases: [], priority_score: priorityMap['가덕도동']
});
addLocation('신호동', {
    lat: 35.085443537101, lon: 128.879107082157, name: '부산광역시 강서구 신호동', type: '행정동', admin_parent: '부산광역시 강서구',
    legal_divisions: ['신호동'], aliases: [], priority_score: priorityMap['신호동']
});

// 부산광역시 연제구 (기초자치단체)
addLocation('연제구', {
    lat: 35.1731861111111, lon: 129.082075, name: '부산광역시 연제구', type: '기초자치단체', admin_parent: '부산광역시',
    legal_divisions: ['거제동', '연산동'], aliases: ['연제구'], priority_score: priorityMap['연제구']
});
// 부산광역시 연제구 행정동
addLocation('거제제1동', {
    lat: 35.1917194444444, lon: 129.083022222222, name: '부산광역시 연제구 거제제1동', type: '행정동', admin_parent: '부산광역시 연제구',
    legal_divisions: ['거제동'], aliases: [], priority_score: priorityMap['거제제1동']
});
addLocation('거제제2동', {
    lat: 35.1845722222222, lon: 129.072541666666, name: '부산광역시 연제구 거제제2동', type: '행정동', admin_parent: '부산광역시 연제구',
    legal_divisions: ['거제동'], aliases: [], priority_score: priorityMap['거제제2동']
});
addLocation('거제제3동', {
    lat: 35.1810333333333, lon: 129.075308333333, name: '부산광역시 연제구 거제제3동', type: '행정동', admin_parent: '부산광역시 연제구',
    legal_divisions: ['거제동'], aliases: [], priority_score: priorityMap['거제제3동']
});
addLocation('거제제4동', {
    lat: 35.1761305555555, lon: 129.070022222222, name: '부산광역시 연제구 거제제4동', type: '행정동', admin_parent: '부산광역시 연제구',
    legal_divisions: ['거제동'], aliases: [], priority_score: priorityMap['거제제4동']
});
addLocation('연산제1동', {
    lat: 35.1858777777777, lon: 129.093844444444, name: '부산광역시 연제구 연산제1동', type: '행정동', admin_parent: '부산광역시 연제구',
    legal_divisions: ['연산동'], aliases: [], priority_score: priorityMap['연산제1동']
});
addLocation('연산제2동', {
    lat: 35.1768333333333, lon: 129.081575, name: '부산광역시 연제구 연산제2동', type: '행정동', admin_parent: '부산광역시 연제구',
    legal_divisions: ['연산동'], aliases: [], priority_score: priorityMap['연산제2동']
});
addLocation('연산제3동', {
    lat: 35.1702694444444, lon: 129.096511111111, name: '부산광역시 연제구 연산제3동', type: '행정동', admin_parent: '부산광역시 연제구',
    legal_divisions: ['연산동'], aliases: [], priority_score: priorityMap['연산제3동']
});
addLocation('연산제4동', {
    lat: 35.1832166666666, lon: 129.087155555555, name: '부산광역시 연제구 연산제4동', type: '행정동', admin_parent: '부산광역시 연제구',
    legal_divisions: ['연산동'], aliases: [], priority_score: priorityMap['연산제4동']
});
addLocation('연산제5동', {
    lat: 35.1814194444444, lon: 129.078355555555, name: '부산광역시 연제구 연산제5동', type: '행정동', admin_parent: '부산광역시 연제구',
    legal_divisions: ['연산동'], aliases: [], priority_score: priorityMap['연산제5동']
});
addLocation('연산제6동', {
    lat: 35.1757722222222, lon: 129.087941666666, name: '부산광역시 연제구 연산제6동', type: '행정동', admin_parent: '부산광역시 연제구',
    legal_divisions: ['연산동'], aliases: [], priority_score: priorityMap['연산제6동']
});
addLocation('연산제8동', {
    lat: 35.1840333333333, lon: 129.103333333333, name: '부산광역시 연제구 연산제8동', type: '행정동', admin_parent: '부산광역시 연제구',
    legal_divisions: ['연산동'], aliases: [], priority_score: priorityMap['연산제8동']
});
addLocation('연산제9동', {
    lat: 35.1855472222222, lon: 129.107197222222, name: '부산광역시 연제구 연산제9동', type: '행정동', admin_parent: '부산광역시 연제구',
    legal_divisions: ['연산동'], aliases: [], priority_score: priorityMap['연산제9동']
});

// 부산광역시 수영구 (기초자치단체)
addLocation('수영구', {
    lat: 35.1424666666666, lon: 129.115375, name: '부산광역시 수영구', type: '기초자치단체', admin_parent: '부산광역시',
    legal_divisions: ['남천동', '수영동', '망미동', '광안동', '민락동'], aliases: ['수영구', '광안리'], priority_score: priorityMap['수영구']
});
// 부산광역시 수영구 행정동
addLocation('남천제1동', {
    lat: 35.139575, lon: 129.112597222222, name: '부산광역시 수영구 남천제1동', type: '행정동', admin_parent: '부산광역시 수영구',
    legal_divisions: ['남천동'], aliases: [], priority_score: priorityMap['남천제1동']
});
addLocation('남천제2동', {
    lat: 35.1407527777777, lon: 129.116986111111, name: '부산광역시 수영구 남천제2동', type: '행정동', admin_parent: '부산광역시 수영구',
    legal_divisions: ['남천동'], aliases: [], priority_score: priorityMap['남천제2동']
});
addLocation('수영동', {
    lat: 35.1673583333333, lon: 129.118288888888, name: '부산광역시 수영구 수영동', type: '행정동', admin_parent: '부산광역시 수영구',
    legal_divisions: ['수영동'], aliases: [], priority_score: priorityMap['수영동']
});
addLocation('망미제1동', {
    lat: 35.1713555555555, lon: 129.103241666666, name: '부산광역시 수영구 망미제1동', type: '행정동', admin_parent: '부산광역시 수영구',
    legal_divisions: ['망미동'], aliases: [], priority_score: priorityMap['망미제1동']
});
addLocation('망미제2동', {
    lat: 35.1721527777777, lon: 129.117541666666, name: '부산광역시 수영구 망미제2동', type: '행정동', admin_parent: '부산광역시 수영구',
    legal_divisions: ['망미동'], aliases: [], priority_score: priorityMap['망미제2동']
});
addLocation('광안제1동', {
    lat: 35.1598666666666, lon: 129.114730555555, name: '부산광역시 수영구 광안제1동', type: '행정동', admin_parent: '부산광역시 수영구',
    legal_divisions: ['광안동'], aliases: ['광안리'], priority_score: priorityMap['광안리']
});
addLocation('광안제2동', {
    lat: 35.1506777777777, lon: 129.114866666666, name: '부산광역시 수영구 광안제2동', type: '행정동', admin_parent: '부산광역시 수영구',
    legal_divisions: ['광안동'], aliases: [], priority_score: priorityMap['광안제2동']
});
addLocation('광안제3동', {
    lat: 35.1648222222222, lon: 129.115855555555, name: '부산광역시 수영구 광안제3동', type: '행정동', admin_parent: '부산광역시 수영구',
    legal_divisions: ['광안동'], aliases: [], priority_score: priorityMap['광안제3동']
});
addLocation('광안제4동', {
    lat: 35.1519666666666, lon: 129.113666666666, name: '부산광역시 수영구 광안제4동', type: '행정동', admin_parent: '부산광역시 수영구',
    legal_divisions: ['광안동'], aliases: [], priority_score: priorityMap['광안제4동']
});
addLocation('민락동', {
    lat: 35.1541666666666, lon: 129.127677777777, name: '부산광역시 수영구 민락동', type: '행정동', admin_parent: '부산광역시 수영구',
    legal_divisions: ['민락동'], aliases: [], priority_score: priorityMap['민락동']
});

// 부산광역시 사상구 (기초자치단체)
addLocation('사상구', {
    lat: 35.1494666666666, lon: 128.993333333333, name: '부산광역시 사상구', type: '기초자치단체', admin_parent: '부산광역시',
    legal_divisions: ['삼락동', '모라동', '덕포동', '괘법동', '감전동', '주례동', '학장동', '엄궁동'], aliases: ['사상구'], priority_score: priorityMap['사상구']
});
// 부산광역시 사상구 행정동
addLocation('삼락동', {
    lat: 35.1738944444444, lon: 128.979966666666, name: '부산광역시 사상구 삼락동', type: '행정동', admin_parent: '부산광역시 사상구',
    legal_divisions: ['삼락동'], aliases: [], priority_score: priorityMap['삼락동']
});
addLocation('모라제1동', {
    lat: 35.1845361111111, lon: 128.989688888888, name: '부산광역시 사상구 모라제1동', type: '행정동', admin_parent: '부산광역시 사상구',
    legal_divisions: ['모라동'], aliases: [], priority_score: priorityMap['모라제1동']
});
addLocation('모라제3동', {
    lat: 35.1815583333333, lon: 128.998333333333, name: '부산광역시 사상구 모라제3동', type: '행정동', admin_parent: '부산광역시 사상구',
    legal_divisions: ['모라동'], aliases: [], priority_score: priorityMap['모라제3동']
});
addLocation('덕포제1동', {
    lat: 35.1672833333333, lon: 128.985530555555, name: '부산광역시 사상구 덕포제1동', type: '행정동', admin_parent: '부산광역시 사상구',
    legal_divisions: ['덕포동'], aliases: [], priority_score: priorityMap['덕포제1동']
});
addLocation('덕포제2동', {
    lat: 35.1713805555555, lon: 128.985177777777, name: '부산광역시 사상구 덕포제2동', type: '행정동', admin_parent: '부산광역시 사상구',
    legal_divisions: ['덕포동'], aliases: [], priority_score: priorityMap['덕포제2동']
});
addLocation('괘법동', {
    lat: 35.1606722222222, lon: 128.989444444444, name: '부산광역시 사상구 괘법동', type: '행정동', admin_parent: '부산광역시 사상구',
    legal_divisions: ['괘법동'], aliases: [], priority_score: priorityMap['괘법동']
});
addLocation('감전동', {
    lat: 35.1512333333333, lon: 128.981708333333, name: '부산광역시 사상구 감전동', type: '행정동', admin_parent: '부산광역시 사상구',
    legal_divisions: ['감전동'], aliases: [], priority_score: priorityMap['감전동']
});
addLocation('주례제1동', {
    lat: 35.1486194444444, lon: 129.000144444444, name: '부산광역시 사상구 주례제1동', type: '행정동', admin_parent: '부산광역시 사상구',
    legal_divisions: ['주례동'], aliases: [], priority_score: priorityMap['주례제1동']
});
addLocation('주례제2동', {
    lat: 35.1469888888888, lon: 129.012733333333, name: '부산광역시 사상구 주례제2동', type: '행정동', admin_parent: '부산광역시 사상구',
    legal_divisions: ['주례동'], aliases: [], priority_score: priorityMap['주례제2동']
});
addLocation('주례제3동', {
    lat: 35.1442888888888, lon: 129.003722222222, name: '부산광역시 사상구 주례제3동', type: '행정동', admin_parent: '부산광역시 사상구',
    legal_divisions: ['주례동'], aliases: [], priority_score: priorityMap['주례제3동']
});
addLocation('학장동', {
    lat: 35.1409916666666, lon: 128.989677777777, name: '부산광역시 사상구 학장동', type: '행정동', admin_parent: '부산광역시 사상구',
    legal_divisions: ['학장동'], aliases: [], priority_score: priorityMap['학장동']
});
addLocation('엄궁동', {
    lat: 35.1256, lon: 128.974444444444, name: '부산광역시 사상구 엄궁동', type: '행정동', admin_parent: '부산광역시 사상구',
    legal_divisions: ['엄궁동'], aliases: [], priority_score: priorityMap['엄궁동']
});

// 부산광역시 기장군 (기초자치단체)
addLocation('기장군', {
    lat: 35.24135, lon: 129.224475, name: '부산광역시 기장군', type: '기초자치단체', admin_parent: '부산광역시',
    legal_divisions: ['기장읍', '장안읍', '정관읍', '일광읍', '철마면'], aliases: ['기장군'], priority_score: priorityMap['기장군']
});
// 부산광역시 기장군 읍·면
addLocation('기장읍', {
    lat: 35.2356027777777, lon: 129.218177777777, name: '부산광역시 기장군 기장읍', type: '읍', admin_parent: '부산광역시 기장군',
    legal_divisions: [
        '대라리', '동부리', '서부리', '죽성리', '연화리', '대변리', '청강리', '시랑리', '만화리', '석산리', '교리', '대룡리', '용소리'
    ],
    aliases: [], priority_score: priorityMap['기장읍']
});
addLocation('장안읍', {
    lat: 35.3107027777777, lon: 129.246288888888, name: '부산광역시 기장군 장안읍', type: '읍', admin_parent: '부산광역시 기장군',
    legal_divisions: [
        '좌천리', '임랑리', '길천리', '반룡리', '명례리', '월내리', '덕선리', '오리', '장안리'
    ],
    aliases: [], priority_score: priorityMap['장안읍']
});
addLocation('정관읍', {
    lat: 35.322375, lon: 129.182677777777, name: '부산광역시 기장군 정관읍', type: '읍', admin_parent: '부산광역시 기장군',
    legal_divisions: [
        '방곡리', '병산리', '달산리', '예림리', '임곡리', '웅천리', '용수리', '매학리', '월평리', '곰내리', '두명리'
    ],
    aliases: [], priority_score: priorityMap['정관읍']
});
addLocation('일광읍', {
    lat: 35.2639371829939, lon: 129.23228251585, name: '부산광역시 기장군 일광읍', type: '읍', admin_parent: '부산광역시 기장군',
    legal_divisions: [
        '삼성리', '학리', '동백리', '칠암리', '문동리', '횡계리', '용천리', '원리', '이천리'
    ],
    aliases: [], priority_score: priorityMap['일광읍']
});
addLocation('철마면', {
    lat: 35.2721972222222, lon: 129.152022222222, name: '부산광역시 기장군 철마면', type: '면', admin_parent: '부산광역시 기장군',
    legal_divisions: [
        '연구리', '송정리', '장전리', '웅천리', '고촌리', '백길리', '와여리', '이곡리', '미동리'
    ],
    aliases: [], priority_score: priorityMap['철마면']
});




















    
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

    // =============================================================
    // 전국 주요 도시 및 지역 데이터 추가 (weather.js에서 이관)
    // 서울특별시
    addLocation('서울특별시', { lat: 37.5665, lon: 126.9780, name: '서울특별시', type: '광역자치단체', aliases: ['서울', '서울시'], priority_score: priorityMap['서울특별시'] });
    addLocation('종로구', { lat: 37.5735, lon: 126.9788, name: '서울특별시 종로구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['종로구'] });
    addLocation('중구서울', { lat: 37.5641, lon: 126.9979, name: '서울특별시 중구', type: '기초자치단체', admin_parent: '서울특별시', aliases: ['중구'], priority_score: priorityMap['중구'] });
    addLocation('용산구', { lat: 37.5326, lon: 126.9905, name: '서울특별시 용산구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['용산구'] });
    addLocation('성동구', { lat: 37.5635, lon: 127.0365, name: '서울특별시 성동구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['성동구'] });
    addLocation('광진구', { lat: 37.5384, lon: 127.0822, name: '서울특별시 광진구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['광진구'] });
    addLocation('동대문구', { lat: 37.5744, lon: 127.0394, name: '서울특별시 동대문구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['동대문구'] });
    addLocation('중랑구', { lat: 37.6063, lon: 127.0925, name: '서울특별시 중랑구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['중랑구'] });
    addLocation('성북구', { lat: 37.5894, lon: 127.0167, name: '서울특별시 성북구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['성북구'] });
    addLocation('강북구', { lat: 37.6397, lon: 127.0256, name: '서울특별시 강북구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['강북구'] });
    addLocation('도봉구', { lat: 37.6688, lon: 127.0471, name: '서울특별시 도봉구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['도봉구'] });
    addLocation('노원구', { lat: 37.6541, lon: 127.0568, name: '서울특별시 노원구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['노원구'] });
    addLocation('은평구', { lat: 37.6176, lon: 126.9227, name: '서울특별시 은평구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['은평구'] });
    addLocation('서대문구', { lat: 37.5791, lon: 126.9368, name: '서울특별시 서대문구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['서대문구'] });
    addLocation('마포구', { lat: 37.5615, lon: 126.9088, name: '서울특별시 마포구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['마포구'] });
    addLocation('양천구', { lat: 37.5173, lon: 126.8665, name: '서울특별시 양천구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['양천구'] });
    addLocation('강서구', { lat: 37.5509, lon: 126.8495, name: '서울특별시 강서구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['강서구'] });
    addLocation('구로구', { lat: 37.4954, lon: 126.8874, name: '서울특별시 구로구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['구로구'] });
    addLocation('금천구', { lat: 37.4571, lon: 126.9009, name: '서울특별시 금천구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['금천구'] });
    addLocation('영등포구', { lat: 37.5262, lon: 126.9095, name: '서울특별시 영등포구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['영등포구'] });
    addLocation('동작구', { lat: 37.5124, lon: 126.9392, name: '서울특별시 동작구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['동작구'] });
    addLocation('관악구', { lat: 37.4784, lon: 126.9517, name: '서울특별시 관악구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['관악구'] });
    addLocation('서초구', { lat: 37.4837, lon: 127.0324, name: '서울특별시 서초구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['서초구'] });
    addLocation('강남구', { lat: 37.5172, lon: 127.0473, name: '서울특별시 강남구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['강남구'] });
    addLocation('송파구', { lat: 37.5145, lon: 127.1054, name: '서울특별시 송파구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['송파구'] });
    addLocation('강동구', { lat: 37.5298, lon: 127.1269, name: '서울특별시 강동구', type: '기초자치단체', admin_parent: '서울특별시', aliases: [], priority_score: priorityMap['강동구'] });
    addLocation('명동', { lat: 37.5610, lon: 126.9860, name: '서울특별시 중구 명동', type: '법정동', admin_parent: '서울특별시 중구', aliases: [], priority_score: priorityMap['명동'] });
    addLocation('홍대', { lat: 37.5577, lon: 126.9248, name: '서울특별시 마포구 서교동', type: '별칭', admin_parent: '서울특별시 마포구', aliases: ['홍대입구'], priority_score: priorityMap['홍대'] });
    addLocation('강남', { lat: 37.4981, lon: 127.0276, name: '서울특별시 강남구 역삼동', type: '별칭', admin_parent: '서울특별시 강남구', aliases: ['강남역'], priority_score: priorityMap['강남'] });
    addLocation('이태원', { lat: 37.5345, lon: 126.9934, name: '서울특별시 용산구 이태원동', type: '법정동', admin_parent: '서울특별시 용산구', aliases: [], priority_score: priorityMap['이태원'] });
    addLocation('잠실', { lat: 37.5116, lon: 127.1000, name: '서울특별시 송파구 잠실동', type: '법정동', admin_parent: '서울특별시 송파구', aliases: ['잠실역'], priority_score: priorityMap['잠실'] });
    addLocation('여의도', { lat: 37.5222, lon: 126.9242, name: '서울특별시 영등포구 여의도동', type: '법정동', admin_parent: '서울특별시 영등포구', aliases: [], priority_score: priorityMap['여의도'] });
    addLocation('신촌', { lat: 37.5598, lon: 126.9423, name: '서울특별시 서대문구 신촌동', type: '법정동', admin_parent: '서울특별시 서대문구', aliases: [], priority_score: priorityMap['신촌'] });
    addLocation('동대문', { lat: 37.5714, lon: 127.0094, name: '서울특별시 종로구 종로6가', type: '별칭', admin_parent: '서울특별시 종로구', aliases: ['동대문시장'], priority_score: priorityMap['동대문'] });
    addLocation('종로', { lat: 37.5700, lon: 126.9790, name: '서울특별시 종로구 종로1가', type: '별칭', admin_parent: '서울특별시 종로구', aliases: ['종각'], priority_score: priorityMap['종로'] });


    // 부산광역시
    addLocation('부산광역시', { lat: 35.1796, lon: 129.0756, name: '부산광역시', type: '광역자치단체', aliases: ['부산', '부산시'], priority_score: priorityMap['부산광역시'] });
    addLocation('해운대구', { lat: 35.1633, lon: 129.1659, name: '부산광역시 해운대구', type: '기초자치단체', admin_parent: '부산광역시', aliases: [], priority_score: priorityMap['해운대구'] });
    addLocation('광안리', { lat: 35.1539, lon: 129.1179, name: '부산광역시 수영구 광안동', type: '별칭', admin_parent: '부산광역시 수영구', aliases: ['광안리해수욕장'], priority_score: priorityMap['광안리'] });
    addLocation('서면', { lat: 35.1585, lon: 129.0601, name: '부산광역시 부산진구 부전동', type: '별칭', admin_parent: '부산광역시 부산진구', aliases: ['서면역'], priority_score: priorityMap['서면'] });
    addLocation('남포동', { lat: 35.1017, lon: 129.0270, name: '부산광역시 중구 남포동', type: '법정동', admin_parent: '부산광역시 중구', aliases: [], priority_score: priorityMap['남포동'] });
    addLocation('태종대', { lat: 35.0505, lon: 129.0963, name: '부산광역시 영도구 동삼동', type: '별칭', admin_parent: '부산광역시 영도구', aliases: ['태종대유원지'], priority_score: priorityMap['태종대'] });
    addLocation('기장군', { lat: 35.2435, lon: 129.2173, name: '부산광역시 기장군', type: '기초자치단체', admin_parent: '부산광역시', aliases: [], priority_score: priorityMap['기장군'] });


    // 대구광역시
    addLocation('대구광역시', { lat: 35.8722, lon: 128.6014, name: '대구광역시', type: '광역자치단체', aliases: ['대구', '대구시'], priority_score: priorityMap['대구광역시'] });
    addLocation('동성로', { lat: 35.8690, lon: 128.5940, name: '대구광역시 중구 동성로', type: '별칭', admin_parent: '대구광역시 중구', aliases: [], priority_score: priorityMap['동성로'] });


    // 인천광역시
    addLocation('인천광역시', { lat: 37.4563, lon: 126.7052, name: '인천광역시', type: '광역자치단체', aliases: ['인천', '인천시'], priority_score: priorityMap['인천광역시'] });
    addLocation('송도', { lat: 37.3800, lon: 126.6370, name: '인천광역시 연수구 송도동', type: '별칭', admin_parent: '인천광역시 연수구', aliases: ['송도국제도시'], priority_score: priorityMap['송도'] });
    addLocation('월미도', { lat: 37.4720, lon: 126.6080, name: '인천광역시 중구 북성동1가', type: '별칭', admin_parent: '인천광역시 중구', aliases: ['월미도공원'], priority_score: priorityMap['월미도'] });
    addLocation('강화군', { lat: 37.7476, lon: 126.4173, name: '인천광역시 강화군', type: '기초자치단체', admin_parent: '인천광역시', aliases: [], priority_score: priorityMap['강화군'] });
    addLocation('을왕리', { lat: 37.4699, lon: 126.3400, name: '인천광역시 중구 을왕동', type: '별칭', admin_parent: '인천광역시 중구', aliases: ['을왕리해수욕장'], priority_score: priorityMap['을왕리'] });


    // 광주광역시
    addLocation('광주광역시', { lat: 35.1600, lon: 126.8514, name: '광주광역시', type: '광역자치단체', aliases: ['광주', '광주시'], priority_score: priorityMap['광주광역시'] });
    addLocation('무등산', { lat: 35.1000, lon: 126.9600, name: '광주광역시 동구 운림동', type: '별칭', admin_parent: '광주광역시 동구', aliases: ['무등산국립공원'], priority_score: priorityMap['무등산'] });


    // 대전광역시
    addLocation('대전광역시', { lat: 36.3504, lon: 127.3845, name: '대전광역시', type: '광역자치단체', aliases: ['대전', '대전시'], priority_score: priorityMap['대전광역시'] });
    addLocation('유성구', { lat: 36.3524, lon: 127.3423, name: '대전광역시 유성구', type: '기초자치단체', admin_parent: '대전광역시', aliases: [], priority_score: priorityMap['유성구'] });


    // 울산광역시
    addLocation('울산광역시', { lat: 35.5384, lon: 129.3113, name: '울산광역시', type: '광역자치단체', aliases: ['울산', '울산시'], priority_score: priorityMap['울산광역시'] });


    // 세종특별자치시
    addLocation('세종특별자치시', { lat: 36.4800, lon: 127.2890, name: '세종특별자치시', type: '광역자치단체', aliases: ['세종', '세종시'], priority_score: priorityMap['세종특별자치시'] });


    // 경기도 주요 도시 (일부)
    addLocation('수원시', { lat: 37.2635, lon: 127.0286, name: '경기도 수원시', type: '기초자치단체', admin_parent: '경기도', aliases: [], priority_score: priorityMap['수원시'] });
    addLocation('성남시', { lat: 37.4385, lon: 127.1373, name: '경기도 성남시', type: '기초자치단체', admin_parent: '경기도', aliases: [], priority_score: priorityMap['성남시'] });
    addLocation('용인시', { lat: 37.2350, lon: 127.2287, name: '경기도 용인시', type: '기초자치단체', admin_parent: '경기도', aliases: [], priority_score: priorityMap['용인시'] });
    addLocation('안양시', { lat: 37.3943, lon: 126.9568, name: '경기도 안양시', type: '기초자치단체', admin_parent: '경기도', aliases: [], priority_score: priorityMap['안양시'] });
    addLocation('안산시', { lat: 37.3223, lon: 126.8200, name: '경기도 안산시', type: '기초자치단체', admin_parent: '경기도', aliases: [], priority_score: priorityMap['안산시'] });
    addLocation('고양시', { lat: 37.6586, lon: 126.8320, name: '경기도 고양시', type: '기초자치단체', admin_parent: '경기도', aliases: [], priority_score: priorityMap['고양시'] });
    addLocation('화성시', { lat: 37.2000, lon: 126.8000, name: '경기도 화성시', type: '기초자치단체', admin_parent: '경기도', aliases: [], priority_score: priorityMap['화성시'] });
    addLocation('평택시', { lat: 36.9900, lon: 127.1000, name: '경기도 평택시', type: '기초자치단체', admin_parent: '경기도', aliases: [], priority_score: priorityMap['평택시'] });
    addLocation('남양주시', { lat: 37.6360, lon: 127.2100, name: '경기도 남양주시', type: '기초자치단체', admin_parent: '경기도', aliases: [], priority_score: priorityMap['남양주시'] });
    addLocation('부천시', { lat: 37.5030, lon: 126.7640, name: '경기도 부천시', type: '기초자치단체', admin_parent: '경기도', aliases: [], priority_score: priorityMap['부천시'] });


    // 강원특별자치도 (일부)
    addLocation('강원특별자치도', { lat: 37.8850, lon: 127.7340, name: '강원특별자치도', type: '광역자치단체', aliases: ['강원도'], priority_score: priorityMap['강원특별자치도'] });
    addLocation('춘천시', { lat: 37.8850, lon: 127.7340, name: '강원특별자치도 춘천시', type: '기초자치단체', admin_parent: '강원특별자치도', aliases: [], priority_score: priorityMap['춘천시'] });
    addLocation('원주시', { lat: 37.3480, lon: 127.9200, name: '강원특별자치도 원주시', type: '기초자치단체', admin_parent: '강원특별자치도', aliases: [], priority_score: priorityMap['원주시'] });
    addLocation('강릉시', { lat: 37.7518, lon: 128.8751, name: '강원특별자치도 강릉시', type: '기초자치단체', admin_parent: '강원특별자치도', aliases: [], priority_score: priorityMap['강릉시'] });
    addLocation('속초시', { lat: 38.2000, lon: 128.5800, name: '강원특별자치도 속초시', type: '기초자치단체', admin_parent: '강원특별자치도', aliases: [], priority_score: priorityMap['속초시'] });
    addLocation('설악산국립공원', { lat: 38.1180, lon: 128.4600, name: '설악산국립공원', type: '별칭', admin_parent: '강원특별자치도 속초시', aliases: ['설악산'], priority_score: priorityMap['설악산국립공원'] });
    addLocation('오대산국립공원', { lat: 37.7900, lon: 128.5500, name: '오대산국립공원', type: '별칭', admin_parent: '강원특별자치도 평창군', aliases: ['오대산'], priority_score: priorityMap['오대산국립공원'] });
    addLocation('정동진', { lat: 37.6900, lon: 129.0200, name: '강원특별자치도 강릉시 강동면 정동진리', type: '별칭', admin_parent: '강원특별자치도 강릉시', aliases: [], priority_score: priorityMap['정동진'] });


    // 충청북도 (일부)
    addLocation('충청북도', { lat: 36.6350, lon: 127.4910, name: '충청북도', type: '광역자치단체', aliases: ['충북'], priority_score: priorityMap['충청북도'] });
    addLocation('청주시', { lat: 36.6420, lon: 127.4890, name: '충청북도 청주시', type: '기초자치단체', admin_parent: '충청북도', aliases: [], priority_score: priorityMap['청주시'] });
    addLocation('충주시', { lat: 36.9690, lon: 127.9310, name: '충청북도 충주시', type: '기초자치단체', admin_parent: '충청북도', aliases: [], priority_score: priorityMap['충주시'] });
    addLocation('제천시', { lat: 37.1300, lon: 128.2000, name: '충청북도 제천시', type: '기초자치단체', admin_parent: '충청북도', aliases: [], priority_score: priorityMap['제천시'] });


    // 충청남도 (일부)
    addLocation('충청남도', { lat: 36.5180, lon: 126.8000, name: '충청남도', type: '광역자치단체', aliases: ['충남'], priority_score: priorityMap['충청남도'] });
    addLocation('천안시', { lat: 36.8140, lon: 127.1500, name: '충청남도 천안시', type: '기초자치단체', admin_parent: '충청남도', aliases: [], priority_score: priorityMap['천안시'] });
    addLocation('공주시', { lat: 36.4690, lon: 127.1190, name: '충청남도 공주시', type: '기초자치단체', admin_parent: '충청남도', aliases: [], priority_score: priorityMap['공주시'] });
    addLocation('보령시', { lat: 36.3800, lon: 126.6100, name: '충청남도 보령시', type: '기초자치단체', admin_parent: '충청남도', aliases: [], priority_score: priorityMap['보령시'] });
    addLocation('태안군', { lat: 36.7500, lon: 126.3000, name: '충청남도 태안군', type: '기초자치단체', admin_parent: '충청남도', aliases: [], priority_score: priorityMap['태안군'] });
    addLocation('태안 안면도', { lat: 36.5000, lon: 126.3500, name: '충청남도 태안군 안면읍', type: '별칭', admin_parent: '충청남도 태안군', aliases: ['안면도'], priority_score: priorityMap['태안 안면도'] });


    // 전라북도 (일부)
    addLocation('전라북도', { lat: 35.8200, lon: 127.1100, name: '전라북도', type: '광역자치단체', aliases: ['전북'], priority_score: priorityMap['전라북도'] });
    addLocation('전주시', { lat: 35.8200, lon: 127.1100, name: '전라북도 전주시', type: '기초자치단체', admin_parent: '전라북도', aliases: [], priority_score: priorityMap['전주시'] });
    addLocation('군산시', { lat: 35.9700, lon: 126.7200, name: '전라북도 군산시', type: '기초자치단체', admin_parent: '전라북도', aliases: [], priority_score: priorityMap['군산시'] });
    addLocation('익산시', { lat: 35.9400, lon: 126.9400, name: '전라북도 익산시', type: '기초자치단체', admin_parent: '전라북도', aliases: [], priority_score: priorityMap['익산시'] });
    addLocation('전주 한옥마을', { lat: 35.8150, lon: 127.1500, name: '전라북도 전주시 완산구 교동', type: '별칭', admin_parent: '전라북도 전주시', aliases: ['한옥마을'], priority_score: priorityMap['전주 한옥마을'] });
    addLocation('내장산', { lat: 35.4800, lon: 126.9000, name: '전라북도 정읍시 내장동', type: '별칭', admin_parent: '전라북도 정읍시', aliases: ['내장산국립공원'], priority_score: priorityMap['내장산'] });


    // 전라남도 (일부)
    addLocation('전라남도', { lat: 34.8100, lon: 126.4000, name: '전라남도', type: '광역자치단체', aliases: ['전남'], priority_score: priorityMap['전라남도'] });
    addLocation('목포시', { lat: 34.8000, lon: 126.3900, name: '전라남도 목포시', type: '기초자치단체', admin_parent: '전라남도', aliases: [], priority_score: priorityMap['목포시'] });
    addLocation('여수시', { lat: 34.7600, lon: 127.6600, name: '전라남도 여수시', type: '기초자치단체', admin_parent: '전라남도', aliases: [], priority_score: priorityMap['여수시'] });
    addLocation('순천시', { lat: 34.9500, lon: 127.5300, name: '전라남도 순천시', type: '기초자치단체', admin_parent: '전라남도', aliases: [], priority_score: priorityMap['순천시'] });
    addLocation('여수 엑스포', { lat: 34.7570, lon: 127.7410, name: '전라남도 여수시 덕충동', type: '별칭', admin_parent: '전라남도 여수시', aliases: ['여수엑스포'], priority_score: priorityMap['여수 엑스포'] });
    addLocation('보성 녹차밭', { lat: 34.7600, lon: 127.3500, name: '전라남도 보성군 보성읍 녹차로', type: '별칭', admin_parent: '전라남도 보성군', aliases: ['보성녹차밭'], priority_score: priorityMap['보성 녹차밭'] });


    // 경상북도 (일부)
    addLocation('경상북도', { lat: 36.5750, lon: 128.5050, name: '경상북도', type: '광역자치단체', aliases: ['경북'], priority_score: priorityMap['경상북도'] });
    addLocation('포항시', { lat: 36.0300, lon: 129.3600, name: '경상북도 포항시', type: '기초자치단체', admin_parent: '경상북도', aliases: [], priority_score: priorityMap['포항시'] });
    addLocation('경주시', { lat: 35.8500, lon: 129.2100, name: '경상북도 경주시', type: '기초자치단체', admin_parent: '경상북도', aliases: [], priority_score: priorityMap['경주시'] });
    addLocation('안동시', { lat: 36.5680, lon: 128.7290, name: '경상북도 안동시', type: '기초자치단체', admin_parent: '경상북도', aliases: [], priority_score: priorityMap['안동시'] });
    addLocation('경주 역사유적지구', { lat: 35.8300, lon: 129.2200, name: '경상북도 경주시 인교동', type: '별칭', admin_parent: '경상북도 경주시', aliases: ['불국사', '첨성대'], priority_score: priorityMap['경주 역사유적지구'] });
    addLocation('안동 하회마을', { lat: 36.5300, lon: 128.2600, name: '경상북도 안동시 풍천면 하회리', type: '별칭', admin_parent: '경상북도 안동시', aliases: ['하회마을'], priority_score: priorityMap['안동 하회마을'] });


    // 경상남도 (일부)
    addLocation('경상남도', { lat: 35.2380, lon: 128.6920, name: '경상남도', type: '광역자치단체', aliases: ['경남'], priority_score: priorityMap['경상남도'] });
    addLocation('창원시', { lat: 35.2200, lon: 128.6800, name: '경상남도 창원시', type: '기초자치단체', admin_parent: '경상남도', aliases: [], priority_score: priorityMap['창원시'] });
    addLocation('진주시', { lat: 35.1900, lon: 128.0800, name: '경상남도 진주시', type: '기초자치단체', admin_parent: '경상남도', aliases: [], priority_score: priorityMap['진주시'] });
    addLocation('통영시', { lat: 34.8400, lon: 128.4300, name: '경상남도 통영시', type: '기초자치단체', admin_parent: '경상남도', aliases: [], priority_score: priorityMap['통영시'] });
    addLocation('통영 케이블카', { lat: 34.8400, lon: 128.4000, name: '경상남도 통영시 도남동', type: '별칭', admin_parent: '경상남도 통영시', aliases: ['미륵산케이블카'], priority_score: priorityMap['통영 케이블카'] });
    addLocation('거제 외도', { lat: 34.7800, lon: 128.7000, name: '경상남도 거제시 일운면 와현리', type: '별칭', admin_parent: '경상남도 거제시', aliases: ['외도보타니아'], priority_score: priorityMap['거제 외도'] });

    // 기타 국립공원
    addLocation('지리산국립공원', { lat: 35.3360, lon: 127.7300, name: '지리산국립공원', type: '별칭', aliases: ['지리산'], priority_score: priorityMap['지리산국립공원'] });
    addLocation('북한산국립공원', { lat: 37.6500, lon: 126.9700, name: '북한산국립공원', type: '별칭', aliases: ['북한산'], priority_score: priorityMap['북한산국립공원'] });
    addLocation('계룡산국립공원', { lat: 36.3500, lon: 127.2800, name: '계룡산국립공원', type: '별칭', aliases: ['계룡산'], priority_score: priorityMap['계룡산국립공원'] });


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
