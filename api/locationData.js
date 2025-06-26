/**
 * @file locationData.js
 * @description 전국 지역 정보를 담는 데이터 파일.
 * 기상청 날씨 API 연동, 사용자 입력 대응, 행정 계층 구조 및 우선순위 정렬을 목적으로 합니다.
 * 이 파일은 weather.js에서 `require` 방식으로 임포트될 수 있도록 CommonJS 형식으로 변경되었습니다.
 *
 * 이 버전은 법정동/리는 직접적인 지역 항목으로 추가하지 않고,
 * 해당 법정동/리를 관할하는 행정동/읍/면의 'legal_divisions'에 포함시켜 매핑합니다.
 * '법환동' 검색 시 '대륜동' 정보가 반환되도록 수정되었습니다.
 * 서울 지역 데이터는 사용자의 요청에 따라 제외되었습니다.
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
        '중문동': 900, '동홍동': 890, '서홍동': 880, '대륜동': 870, // 대륜동 우선순위 유지
        '천지동': 860, '정방동': 850, '중앙동': 840, '효돈동': 830,
        '영천동': 820, '대천동': 810, '예래동': 800,
        '성산읍': 730, '대정읍': 720, '남원읍': 710, '표선면': 700, '안덕면': 690,

        // 전국 주요 도시 및 지역 추가 (서울 지역은 요청에 따라 제외되었습니다.)
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
        
        // latLonToGrid로 kma_nx, kma_ny 자동 계산
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
            if (!data[alias] || data[alias].priority_score < aliasPriority) {
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
            if (!data[legalDiv] || data[legalDiv].priority_score < legalDivPriority) { 
                data[legalDiv] = newLocation;
                data[legalDiv].priority_score = legalDivPriority; // 참조된 객체에 우선순위 저장
            }
        });
    };

    
   // 서울특별시
    addLocation({ name: '서울특별시', lat: 37.5665, lon: 126.9780, type: '광역자치단체', aliases: ['서울', '서울시'] });

    // 종로구 및 하위 동
    addLocation({ name: '서울특별시 종로구', lat: 37.5735, lon: 126.9788, type: '기초자치단체', admin_parent: '서울특별시', aliases: ['종로구'] });
    addLocation({ name: '서울특별시 종로구 청운효자동', lat: 37.5852, lon: 126.9691, type: '행정동', admin_parent: '서울특별시 종로구', legal_divisions: ['청운동', '효자동', '궁정동', '신교동', '창성동', '통인동', '누하동', '옥인동', '필운동', '내자동'] });
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


  // =============================================================
    // 제주특별자치도 데이터
    // 고객님 요청에 따라 서울 지역 데이터는 제외되었습니다.

    addLocation({ name: '제주특별자치도', lat: 33.3616, lon: 126.5292, type: '광역자치단체', aliases: ['제주도'] });
    addLocation({ name: '제주시', lat: 33.5097, lon: 126.5219, type: '기초자치단체', admin_parent: '제주특별자치도' });
    addLocation({ name: '서귀포시', lat: 33.2509, lon: 126.5646, type: '기초자치단체', admin_parent: '제주특별자치도' });

    // 제주시 행정동/읍/면
    addLocation({ name: '연동', lat: 33.4862, lon: 126.4912, type: '행정동', admin_parent: '제주시', legal_divisions: ['연동'] });
    addLocation({ name: '노형동', lat: 33.4891, lon: 126.4770, type: '행정동', admin_parent: '제주시', legal_divisions: ['노형동'] });
    addLocation({ name: '아라동', lat: 33.4751, lon: 126.5448, type: '행정동', admin_parent: '제주시', legal_divisions: ['아라일동', '아라이동'] });
    addLocation({ name: '이도2동', lat: 33.4939, lon: 126.5361, type: '행정동', admin_parent: '제주시', legal_divisions: ['이도이동'] });
    addLocation({ name: '일도2동', lat: 33.5065, lon: 126.5332, type: '행정동', admin_parent: '제주시', legal_divisions: ['일도이동'] });
    addLocation({ name: '삼양동', lat: 33.5309, lon: 126.5861, type: '행정동', admin_parent: '제주시', legal_divisions: ['삼양일동', '삼양이동', '삼양삼동'] });
    addLocation({ name: '화북동', lat: 33.5222, lon: 126.5694, type: '행정동', admin_parent: '제주시', legal_divisions: ['화북일동', '화북이동'] });
    addLocation({ name: '이도1동', lat: 33.4988, lon: 126.5250, type: '행정동', admin_parent: '제주시', legal_divisions: ['이도일동'] });
    addLocation({ name: '일도1동', lat: 33.5085, lon: 126.5278, type: '행정동', admin_parent: '제주시', legal_divisions: ['일도일동'] });
    addLocation({ name: '삼도1동', lat: 33.5133, lon: 126.5186, type: '행정동', admin_parent: '제주시', legal_divisions: ['삼도일동'] });
    addLocation({ name: '삼도2동', lat: 33.5117, lon: 126.5147, type: '행정동', admin_parent: '제주시', legal_divisions: ['삼도이동'] });
    addLocation({ name: '건입동', lat: 33.5146, lon: 126.5342, type: '행정동', admin_parent: '제주시', legal_divisions: ['건입동'] });
    addLocation({ name: '오라동', lat: 33.4842, lon: 126.5056, type: '행정동', admin_parent: '제주시', legal_divisions: ['오라일동', '오라이동', '오라삼동'] });
    addLocation({ name: '외도동', lat: 33.5139, lon: 126.4484, type: '행정동', admin_parent: '제주시', legal_divisions: ['외도일동', '외도이동', '외도삼동'] });
    addLocation({ name: '이호동', lat: 33.5175, lon: 126.4764, type: '행정동', admin_parent: '제주시', legal_divisions: ['이호일동', '이호이동'] });
    addLocation({ name: '도두동', lat: 33.5100, lon: 126.4670, type: '행정동', admin_parent: '제주시', legal_divisions: ['도두일동', '도두이동'] });
    addLocation({ name: '봉개동', lat: 33.4560, lon: 126.5700, type: '행정동', admin_parent: '제주시', legal_divisions: ['봉개동'] });
    addLocation({ name: '한림읍', lat: 33.4154, lon: 126.2690, type: '읍', admin_parent: '제주시', legal_divisions: ['한림리', '대림리', '동명리', '명월리', '상대리', '옹포리', '월림리', '재릉리', '협재리', '금악리', '상명리', '강구리'] });
    addLocation({ name: '애월읍', lat: 33.4344, lon: 126.3559, type: '읍', admin_parent: '제주시', legal_divisions: ['애월리', '곽지리', '수산리', '고내리', '하가리', '신엄리', '봉성리', '소길리', '어음리', '유수암리', '광령리', '상귀리', '하귀리', '장전리', '납읍리', '용흥리', '상가리'] });
    addLocation({ name: '구좌읍', lat: 33.5358, lon: 126.8398, type: '읍', admin_parent: '제주시', legal_divisions: ['김녕리', '덕천리', '동복리', '상도리', '세화리', '송당리', '월정리', '종달리', '평대리', '하도리', '한동리', '행원리'] });
    addLocation({ name: '조천읍', lat: 33.5222, lon: 126.6579, type: '읍', admin_parent: '제주시', legal_divisions: ['조천리', '신촌리', '함덕리', '교래리', '대흘리', '선흘리', '북촌리', '와산리', '선교리'] });
    addLocation({ name: '우도면', lat: 33.5074, lon: 126.9427, type: '면', admin_parent: '제주시', legal_divisions: ['천진리', '서광리', '오봉리', '고수목원'] });
    addLocation({ name: '추자면', lat: 33.9515, lon: 126.2995, type: '면', admin_parent: '제주시', legal_divisions: ['대서리', '묵리', '신양리', '영흥리', '예초리'] });
    addLocation({ name: '한경면', lat: 33.3275, lon: 126.1730, type: '면', admin_parent: '제주시', legal_divisions: ['고산리', '낙천리', '두모리', '판포리', '용수리', '신창리', '저지리', '청수리', '조수리', '금등리', '옹포리', '산포리', '대정리'] });

    // 서귀포시 행정동/읍/면
    addLocation({ name: '중문동', lat: 33.2427, lon: 126.4287, type: '행정동', admin_parent: '서귀포시', legal_divisions: ['중문동'] });
    addLocation({ name: '동홍동', lat: 33.2599, lon: 126.5615, type: '행정동', admin_parent: '서귀포시', legal_divisions: ['동홍동'] });
    addLocation({ name: '서홍동', lat: 33.2599, lon: 126.5510, type: '행정동', admin_parent: '서귀포시', legal_divisions: ['서홍동'] });
    addLocation({ name: '대륜동', lat: 33.2428, lon: 126.5273, type: '행정동', admin_parent: '서귀포시', legal_divisions: ['강정동', '도순동', '월평동', '하원동', '영남동', '법환동', '서호동', '호근동'] }); // 법환동 포함
    addLocation({ name: '천지동', lat: 33.2492, lon: 126.5620, type: '행정동', admin_parent: '서귀포시', legal_divisions: ['서귀동', '정방동'] });
    addLocation({ name: '정방동', lat: 33.2498, lon: 126.5645, type: '행정동', admin_parent: '서귀포시', legal_divisions: ['정방동'] });
    addLocation({ name: '중앙동', lat: 33.2505, lon: 126.5592, type: '행정동', admin_parent: '서귀포시', legal_divisions: ['서귀동'] });
    addLocation({ name: '효돈동', lat: 33.2625, lon: 126.6025, type: '행정동', admin_parent: '서귀포시', legal_divisions: ['하효동', '토평동', '신효동'] });
    addLocation({ name: '영천동', lat: 33.2847, lon: 126.6346, type: '행정동', admin_parent: '서귀포시', legal_divisions: ['영남동', '토평동'] });
    addLocation({ name: '대천동', lat: 33.2750, lon: 126.4800, type: '행정동', admin_parent: '서귀포시', legal_divisions: ['강정동', '도순동', '월평동', '하원동', '영남동'] });
    addLocation({ name: '예래동', lat: 33.2520, lon: 126.3910, type: '행정동', admin_parent: '서귀포시', legal_divisions: ['상예동', '하예동', '색달동'] });
    addLocation({ name: '성산읍', lat: 33.4357, lon: 126.9189, type: '읍', admin_parent: '서귀포시', legal_divisions: ['성산리', '고성리', '수산리', '온평리', '신양리', '삼달리', '난산리', '신풍리', '시흥리'] });
    addLocation({ name: '대정읍', lat: 33.2269, lon: 126.2626, type: '읍', admin_parent: '서귀포시', legal_divisions: ['하모리', '인성리', '모슬포', '상모리', '보성리', '구억리', '신평리', '안성리', '동일주리', '가파리', '마라리'] });
    addLocation({ name: '남원읍', lat: 33.3082, lon: 126.7029, type: '읍', admin_parent: '서귀포시', legal_divisions: ['남원리', '위미리', '태흥리', '하례리', '신례리', '한남리', '의귀리', '수망리', '고망리'] });
    addLocation({ name: '표선면', lat: 33.3516, lon: 126.8398, type: '면', admin_parent: '서귀포시', legal_divisions: ['표선리', '성읍리', '가시리', '세화리', '토산리', '하천리', '상천리'] });
    addLocation({ name: '안덕면', lat: 33.2800, lon: 126.3270, type: '면', admin_parent: '서귀포시', legal_divisions: ['감산리', '창천리', '상창리', '광평리', '동광리', '덕수리', '화순리', '사계리', '서광리'] });

    // 관광지 및 기타 별칭 (주요 지점)
    addLocation({ name: '성산일출봉', lat: 33.4584, lon: 126.9427, type: '별칭', admin_parent: '서귀포시 성산읍' });
    addLocation({ name: '한라산', lat: 33.3616, lon: 126.5292, type: '별칭', admin_parent: '제주특별자치도', aliases: ['한라산국립공원'] });
    addLocation({ name: '제주공항', lat: 33.5114, lon: 126.4927, type: '별칭', admin_parent: '제주시', aliases: ['제주국제공항'] });
    addLocation({ name: '서귀포 매일올레시장', lat: 33.2497, lon: 126.5658, type: '별칭', admin_parent: '서귀포시 중앙동' });
    addLocation({ name: '협재해수욕장', lat: 33.3948, lon: 126.2393, type: '별칭', admin_parent: '제주시 한림읍' });
    addLocation({ name: '새별오름', lat: 33.4140, lon: 126.3930, type: '별칭', admin_parent: '제주시 애월읍' });


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
                const nameMatches = location.name.toLowerCase().replace(/\s/g, '').includes(lowerCaseQuery);
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
