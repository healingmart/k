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
