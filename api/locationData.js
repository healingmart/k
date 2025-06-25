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
 * 전국의 지역 정보를 담는 데이터 객체.
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

        // 부산광역시
        '부산광역시': 980,
        '해운대구': 880, '광안리': 840, '서면': 840, '남포동': 840, '태종대': 830, '기장군': 820,

        // 대구광역시
        '대구광역시': 970,
        '동성로': 850,

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
        '지리산국립공원': 800, '북한산국립공원': 790, '계룡산국립공원': 780
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
        ], aliases: [], priority_score: priorityMap['성산읍']
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
