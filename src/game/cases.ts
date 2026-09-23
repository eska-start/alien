export type Route = "deliver" | "forward" | "return" | "hold";

export type LetterPage = {
  from: string;
  to: string;
  address: string;
  date: string;
  body: string[];
  reverse: string;
  seal: string;
};

export type CaseClue = {
  id: string;
  title: string;
  excerpt: string;
  memory?: boolean;
};

export type Investigation = {
  id: string;
  label: string;
  title: string;
  location: string;
  left: number;
  top: number;
  description: string;
  clue: CaseClue;
  pages?: string[];
};

export type CaseFile = {
  id: number;
  title: string;
  subtitle: string;
  date: string;
  arrival: string;
  letters: LetterPage[];
  objects: Investigation[];
  route: Route;
  destination: string;
  insightTitle: string;
  insight: string;
  memoryTitle: string;
  memoryLine: string;
  resolution: string;
  returnedNote: string;
};

export const ROUTES: { id: Route; stamp: string; name: string; note: string }[] = [
  { id: "deliver", stamp: "DELIVER", name: "전달", note: "적힌 주소를 찾아 보낸다" },
  { id: "forward", stamp: "FORWARD", name: "전송", note: "다음 주인을 찾아 보낸다" },
  { id: "return", stamp: "RETURN", name: "반송", note: "발신인에게 돌려보낸다" },
  { id: "hold", stamp: "HOLD", name: "보류", note: "함께 도착할 때까지 보관한다" },
];

export const CASES: CaseFile[] = [
  {
    id: 1,
    title: "THE LAST BIRTHDAY",
    subtitle: "마지막 생일",
    date: "1987년 10월 12일",
    arrival: "열 해 동안 오지 못한 편지가, 비에 젖은 채 도착했다.",
    letters: [
      {
        from: "J. BELL",
        to: "MARIA BELL",
        address: "그녀가 가장 행복했던 곳",
        date: "1987. 10. 12",
        body: [
          "마리아에게,",
          "올해는 꼭 케이크를 자르기 전에 돌아갈게.",
          "빈 의자는 치우지 말아 줘. 비가 와도 약속은 잊지 않을 테니.",
          "늘 너를 사랑하는 아빠가.",
        ],
        reverse: "우산은 역 시계 아래에 두었다. 네가 찾으러 올 때까지.",
        seal: "BELLWEATHER · 7:12 PM",
      },
    ],
    objects: [
      {
        id: "cake-photo",
        label: "사진",
        title: "케이크 사진",
        location: "책상 가장자리",
        left: 41,
        top: 71,
        description: "작은 생일 케이크. 열 개의 초. 창가에 놓인 빈 의자를 향해 접시 하나가 더 놓여 있다.",
        clue: {
          id: "case1-photo",
          title: "열 번째 생일",
          excerpt: "사진 뒷면의 날짜는 1987년 10월 12일. '아빠가 오면 초를 켜자.'",
        },
      },
      {
        id: "rain-bulletin",
        label: "기상 전보",
        title: "폭우 경보",
        location: "서류장",
        left: 84,
        top: 48,
        description: "검게 번진 활자 사이로 다리 통제 기록이 남아 있다. 마지막 줄은 접힌 채 서랍에 끼워져 있다.",
        pages: [
          "강변 다리 통제. 오후 7시부터 북쪽 통행을 금지한다. 수위가 내려갈 때까지 역과 강변 사이의 길을 폐쇄할 것.",
          "구조 기록: J. Bell, 우편 수레를 두고 강으로 진입. 그 뒤로 역에 돌아오지 않음.",
        ],
        clue: {
          id: "case1-rain",
          title: "끊긴 다리",
          excerpt: "당일 오후 7시, 폭우로 강변 다리가 폐쇄됐다. 우편배달원 J. Bell은 구조를 도왔다.",
          memory: true,
        },
      },
      {
        id: "station-log",
        label: "역 장부",
        title: "벨웨더 역의 장부",
        location: "벽시계 아래",
        left: 65,
        top: 32,
        description: "역무원이 적은 짧은 문장. 멈춰 선 시계 아래 젖은 편지 하나를 보관했다는 기록이다.",
        clue: {
          id: "case1-platform",
          title: "2번 승강장",
          excerpt: "편지는 2번 승강장의 오래된 대합실에서 발견됐다. 역 시계는 7시 12분에 멈춰 있다.",
        },
      },
    ],
    route: "deliver",
    destination: "벨웨더 역, 2번 승강장",
    insightTitle: "비가 멈추지 않던 저녁",
    insight: "그는 약속을 잊은 것이 아니었다. 다리 위에서 다른 사람을 살리느라 생일 케이크 앞의 빈 의자로 돌아오지 못했다. 편지는 마지막까지 역 시계 아래에 있었다.",
    memoryTitle: "한 자리는 비워 두었다",
    memoryLine: "창밖에 비가 내린다. 아이는 초에 불을 붙이지 않는다. 젖은 우산 하나가 문 옆에 기대어 있다.",
    resolution: "마리아는 여전히 2번 승강장의 오래된 대합실을 찾아온다. 편지 속 글씨를 읽고, 빈 의자 옆에 잠시 앉는다.",
    returnedNote: "돌아온 봉투에는 작은 글씨가 적혀 있다. '저는 여기서 아버지를 기다린 적이 없어요. 역 시계가 멈춘 곳을 찾아보세요.'",
  },
  {
    id: 2,
    title: "THE MAILMAN",
    subtitle: "마지막 배달",
    date: "1954년 3월 4일",
    arrival: "수천 통을 전한 사람이, 마지막 편지만은 부치지 못했다.",
    letters: [
      {
        from: "IVO HAN",
        to: "다음 우편배달원에게",
        address: "내 마지막 배달처",
        date: "1954. 03. 04",
        body: [
          "내 다음 자전거를 탈 사람에게,",
          "종점에 있는 작은 집을 지나치지 말게. 그 집 앞의 우유병에는 늘 물이 고여 있지.",
          "그 집 아이에게 건네야 할 것이 있다. 길을 모르면, 문 앞의 우편함을 찾아 보게.",
          "이보가.",
        ],
        reverse: "종점은 지도에 없다. 길 위에 있는 사람만 안다.",
        seal: "NORTH POST · ROUTE 4",
      },
    ],
    objects: [
      {
        id: "route-map",
        label: "노선 지도",
        title: "구겨진 노선 지도",
        location: "서류장",
        left: 85,
        top: 51,
        description: "비에 불어난 종이 위, 붉은 잉크 대신 검은 연필선이 마을 바깥까지 이어져 있다. 마지막 집은 지워졌다.",
        clue: {
          id: "case2-map",
          title: "지워진 노선",
          excerpt: "7번 과수원 길은 강변 재개발로 사라졌다. 우체부는 매일 노선을 새 주소로 고쳐 썼다.",
          memory: true,
        },
      },
      {
        id: "carrier-ledger",
        label: "근무 기록",
        title: "이보의 근무 기록",
        location: "벽시계 아래",
        left: 62,
        top: 30,
        description: "수십 년의 배달이 날짜별로 단정하게 적혀 있다. 마지막 날만 주소 대신 사람의 이름이 쓰였다.",
        clue: {
          id: "case2-ledger",
          title: "새 우편배달원",
          excerpt: "후임자는 미나. 첫 근무일의 인수 장소는 '노선 4, 오래된 느릅나무 아래'.",
        },
      },
      {
        id: "lunch-tin",
        label: "도시락 통",
        title: "빈 도시락 통",
        location: "책상 서랍",
        left: 51,
        top: 76,
        description: "안쪽 뚜껑에 아이의 삐뚤한 필체로 '아저씨 몫'이라고 쓰여 있다. 오래된 사탕 하나가 남아 있다.",
        clue: {
          id: "case2-lunch",
          title: "종점의 아이",
          excerpt: "도시락 통은 매일 종점 집 앞에 놓여 있었다. 아이는 편지를 받는 대신 사탕을 하나씩 남겼다.",
        },
      },
    ],
    route: "forward",
    destination: "노선 4, 느릅나무 아래의 새 배달원",
    insightTitle: "길은 사람에게 이어진다",
    insight: "지도에서 사라진 것은 길뿐이었다. 이보는 마지막 배달을 대신할 사람을 골랐다. 작은 집의 아이와 새 배달원은 같은 종점에서 서로를 기다리고 있다.",
    memoryTitle: "사탕 하나",
    memoryLine: "젖은 자전거가 멈춘다. 작은 손이 문틈으로 도시락 통을 밀어 놓는다. 우체부는 사탕을 반으로 나눈다.",
    resolution: "미나는 느릅나무 아래에서 이보의 낡은 가방과 편지를 받는다. 사탕 하나를 우편함 위에 올려둔다.",
    returnedNote: "돌아온 편지에는 주소가 없다는 표시가 찍혀 있다. 노선은 끝난 것이 아니라 새로운 배달원에게 이어져야 한다.",
  },
  {
    id: 3,
    title: "TWO LETTERS",
    subtitle: "서로 다른 문장",
    date: "1949년 11월 21일",
    arrival: "같은 밤, 같은 주소를 향하던 두 통의 편지가 나란히 도착했다.",
    letters: [
      {
        from: "ELLA MORROW",
        to: "NOAH VALE",
        address: "푸른 다리의 동쪽 끝",
        date: "1949. 11. 21",
        body: [
          "노아,",
          "네가 오지 않아서 떠난 게 아니야. 강물이 불어나기 전에 아이들을 건너편으로 보내고 있었어.",
          "내가 늦었다고 전해 줘. 그게 내가 남길 수 있는 전부야.",
        ],
        reverse: "강이 가라앉으면, 다리에서 다시 만나자.",
        seal: "BLUE BRIDGE · EAST",
      },
      {
        from: "NOAH VALE",
        to: "ELLA MORROW",
        address: "푸른 다리의 서쪽 끝",
        date: "1949. 11. 21",
        body: [
          "엘라에게,",
          "나는 다리를 떠나지 않았어. 네가 오지 않은 줄 알았어.",
          "오래 기다리는 것은 괜찮았어. 네가 기다렸다는 걸 이제야 알게 되었으니까.",
        ],
        reverse: "비가 그치면, 다리 위에서.",
        seal: "BLUE BRIDGE · WEST",
      },
    ],
    objects: [
      {
        id: "bridge-photo",
        label: "반쪽 사진",
        title: "찢어진 다리 사진",
        location: "책상 위",
        left: 39,
        top: 68,
        description: "낡은 사진의 절반. 강 양쪽에 선 두 사람이 서로를 바라보고 있지만, 사진의 가운데가 찢어져 있다.",
        clue: {
          id: "case3-photo",
          title: "양쪽 끝의 두 사람",
          excerpt: "뒷면에는 '동쪽과 서쪽, 언제나 같은 다리'라고 적혀 있다. 두 사람은 같은 밤을 기다렸다.",
        },
      },
      {
        id: "flood-telegram",
        label: "전보",
        title: "강의 수위 전보",
        location: "창가의 서랍",
        left: 18,
        top: 50,
        description: "물에 잠긴 종이에는 다리 통제 시간과 대피 안내가 남아 있다. 동쪽과 서쪽 출입구는 동시에 막혔다.",
        pages: [
          "강 수위 급상승. 동쪽과 서쪽 출입구 모두 8시 정각부터 폐쇄. 다리 위 대기 금지.",
          "대피 인원 31명. 북쪽 둑 아래에 아이 한 명이 남아 있다는 신고가 8시 04분에 접수됨.",
        ],
        clue: {
          id: "case3-telegram",
          title: "두 개의 출입구",
          excerpt: "홍수로 다리 양쪽이 같은 시각에 폐쇄됐다. 서로를 보지 못한 것은 선택이 아니었다.",
          memory: true,
        },
      },
      {
        id: "postmark-book",
        label: "소인 대장",
        title: "소인 대장",
        location: "서류장",
        left: 84,
        top: 48,
        description: "두 편지는 다른 곳에서, 같은 분에 접수됐다. 두 장의 종이에는 같은 빗방울 자국이 남아 있다.",
        clue: {
          id: "case3-postmark",
          title: "같은 분, 같은 비",
          excerpt: "두 편지는 다리의 서로 반대편에서 8시 06분에 부쳐졌다. 각자 상대가 떠났다고 믿었다.",
        },
      },
    ],
    route: "hold",
    destination: "두 편지를 함께 두는 보관함",
    insightTitle: "다리의 양쪽 끝에서",
    insight: "둘 다 다리에 왔다. 둘 다 기다렸다. 두 편지 중 하나만 먼저 보내면, 남은 한 사람은 또다시 혼자 기다릴 것이다. 이번에는 두 통을 갈라놓지 않는다.",
    memoryTitle: "같은 비를 맞으며",
    memoryLine: "두 개의 그림자가 강 양쪽에 멈춘다. 물은 다리의 발목까지 차오르고, 멀리서 종이배 하나가 지나간다.",
    resolution: "두 편지는 함께 놓인다. 다리 위로 안개가 걷히고, 두 사람이 같은 쪽으로 걸어간다.",
    returnedNote: "봉투가 되돌아오며 찢어진 사진의 나머지 반쪽을 떨어뜨린다. 두 편지는 각각 보낼 것이 아니라 한 쌍으로 두어야 한다.",
  },
  {
    id: 4,
    title: "THE BOY AND THE MOON",
    subtitle: "소년과 달",
    date: "1996년 5월 9일",
    arrival: "글씨보다 그림이 먼저 도착한 편지. 받는 사람은 '엄마'뿐이다.",
    letters: [
      {
        from: "ELIAS",
        to: "엄마",
        address: "달이 걸리는 언덕",
        date: "1996. 05. 09",
        body: [
          "엄마,",
          "오늘 달은 아주 얇은 웃음처럼 보였어.",
          "엄마가 알려준 세 개의 창문을 찾았어. 그 집 지붕 위에서 달을 기다릴게.",
          "밤이 되어도 무섭지 않아. 그림을 같이 넣었어.",
        ],
        reverse: "달이 그 집 지붕에 닿으면 문을 두드려.",
        seal: "GREY HILL · NIGHT POST",
      },
    ],
    objects: [
      {
        id: "moon-drawing",
        label: "아이의 그림",
        title: "달과 세 개의 창문",
        location: "책상 위",
        left: 41,
        top: 68,
        description: "연필로 그린 집, 굴뚝, 커다란 달. 지붕 위에는 아주 작은 사람이 팔을 들고 서 있다.",
        clue: {
          id: "case4-drawing",
          title: "그림 속 집",
          excerpt: "집에는 창문이 세 개, 굴뚝이 하나. 달을 그린 방향은 북쪽 언덕을 향하고 있다.",
          memory: true,
        },
      },
      {
        id: "school-atlas",
        label: "학교 지도책",
        title: "학교의 낡은 지도책",
        location: "서류장",
        left: 85,
        top: 48,
        description: "책장이 부서진 지도책. 산등성이와 오래된 등대가 있는 곳에 아이의 작은 손자국이 찍혔다.",
        pages: [
          "회색 언덕의 등대 숙소. 관리인 가족은 세 개의 창이 난 북쪽 방에서 지냈다.",
          "지도 여백의 연필 메모: '달이 지붕에 걸리면 불을 한 시간 더 켜 둘 것.'",
        ],
        clue: {
          id: "case4-atlas",
          title: "회색 언덕",
          excerpt: "세 개의 창문과 굴뚝이 있는 집은 회색 언덕 등대의 관리인 숙소 하나뿐이다.",
        },
      },
      {
        id: "night-report",
        label: "야간 근무일지",
        title: "등대의 야간 기록",
        location: "벽시계 아래",
        left: 64,
        top: 31,
        description: "작은 쪽지가 오래된 근무일지 사이에 끼워져 있다. 어머니가 마지막으로 등대를 비추던 밤의 기록이다.",
        clue: {
          id: "case4-lighthouse",
          title: "달을 비춘 등대",
          excerpt: "그날 밤 등대는 아이가 길을 찾도록 평소보다 한 시간 더 켜져 있었다.",
        },
      },
    ],
    route: "deliver",
    destination: "회색 언덕의 등대 관리인 숙소",
    insightTitle: "그림은 지도였다",
    insight: "낙서처럼 보였던 집은 어머니가 일하던 등대 숙소다. 소년은 엄마가 돌아오길 기다린 것이 아니라, 함께 보던 달을 마지막으로 다시 보여 주려 했다.",
    memoryTitle: "달까지의 길",
    memoryLine: "작은 손가락이 유리창 위 별 하나를 따라간다. 등대 불빛이 언덕을 돌아 아이의 그림을 비춘다.",
    resolution: "등대 창문 아래 편지를 놓는다. 새벽빛을 받은 그림 속 달이 처음으로 선명해진다.",
    returnedNote: "돌아온 편지에는 '언덕에는 집이 많아요'라고 적혀 있다. 세 개의 창문과 달을 비추던 등대를 함께 찾아야 한다.",
  },
  {
    id: 5,
    title: "EMPTY ADDRESS",
    subtitle: "빈 주소",
    date: "날짜 없음",
    arrival: "주소가 없다. 발신인도 없다. 봉투 앞면에는 이곳의 이름만 적혀 있다.",
    letters: [
      {
        from: "A. VALE",
        to: "ELLIOT",
        address: "DEAD LETTER OFFICE",
        date: "날짜 없음",
        body: [
          "엘리엇에게,",
          "늦어서 미안해.",
          "네가 편지를 전해 주던 모든 밤에, 너에게 갈 편지 한 통이 내 책상에 남아 있었어.",
          "이번에는 내가 찾아왔단다.",
        ],
        reverse: "언젠가 꼭 전달될 거야.",
        seal: "NO RETURN ADDRESS",
      },
    ],
    objects: [
      {
        id: "personnel-card",
        label: "직원 기록",
        title: "직원 기록 카드",
        location: "서류장",
        left: 85,
        top: 50,
        description: "직원 명부는 이름과 입사 날짜가 빼곡하다. 마지막 카드에는 이름만 쓰여 있고, 날짜 칸은 비어 있다.",
        clue: {
          id: "case5-record",
          title: "기록되지 않은 입사일",
          excerpt: "ELLIOT. 담당 구역: 도착하지 못한 편지. 입사 날짜와 퇴직 날짜는 적혀 있지 않다.",
          memory: true,
        },
      },
      {
        id: "old-photograph",
        label: "사진의 뒷면",
        title: "오래된 가족사진",
        location: "책상 서랍",
        left: 51,
        top: 76,
        description: "사진 속 작은 아이는 우편 가방을 메고 있다. 어머니의 손에 든 봉투는 사진 뒷면으로 접혀 보이지 않는다.",
        clue: {
          id: "case5-photo",
          title: "가방을 멘 아이",
          excerpt: "사진 뒷면에는 '네가 처음 가져온 편지, 엄마에게'라고 적혀 있다.",
        },
      },
      {
        id: "unclaimed-ledger",
        label: "미배달 대장",
        title: "마지막 미배달 대장",
        location: "우편함 아래",
        left: 33,
        top: 61,
        description: "오래된 대장의 가장 안쪽 페이지. 같은 필체로 '받을 사람을 찾지 못해 여기까지 돌아왔다'고 적혀 있다.",
        clue: {
          id: "case5-ledger",
          title: "한 통의 미배달 편지",
          excerpt: "발신인은 안나 베일. 수신인은 어린 엘리엇. 반송되지 않은 편지가 이 우편국에 도착했다.",
        },
      },
    ],
    route: "deliver",
    destination: "엘리엇이 오래 머문 우편국의 책상",
    insightTitle: "받는 사람은 늘 여기 있었다",
    insight: "엘리엇은 오래전부터 이곳에서 기다리고 있었다. 다른 사람의 편지는 찾아 주면서, 자기 이름이 적힌 봉투는 한 번도 열어 보지 못했다.",
    memoryTitle: "엄마의 책상",
    memoryLine: "어린 아이가 우편 가방을 두 손으로 쥔다. 어머니는 봉투를 건네며 웃는다. '언젠가 꼭 전달될 거야.'",
    resolution: "엘리엇은 편지를 천천히 접는다. 창밖, 오랫동안 피지 않던 작은 꽃 하나가 비를 털어 낸다.",
    returnedNote: "빈 주소로는 보낼 수 없다는 붉은 반송 문구가 찍혀 있다. 사진과 미배달 대장에서 이름을 찾아야 한다.",
  },
];

export function findClue(caseFile: CaseFile, id: string): CaseClue | undefined {
  return caseFile.objects.flatMap((object) => object.clue).find((clue) => clue.id === id);
}