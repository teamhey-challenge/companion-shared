# companion-shared

차량 캐릭터 AI 컴패니언(앱 Hey, 캐릭터 헤이파리, 팀 Team Hey. 저장소 이름 `companion-*`은 그대로)의 공유 저장소다. 디자인 토큰 파이프라인과 Android Compose 토큰 라이브러리를 담는다. HEY 시절 `hey-shared`에서 `packages/tokens`·`android`만 기록째 떼어 왔다.

## 구성

| 위치 | 내용 |
|---|---|
| `packages/tokens` | 디자인 토큰 정본 `hey.tokens.json`, 생성기 `build.mjs`, 생성물 `dist/tokens.{css,ts}`, CSS 리터럴 검사 |
| `packages/protocol` | 빈 패키지. 컴패니언 메시지·프로토콜 타입을 새로 쓴다 |
| `packages/copy` | 빈 패키지. 컴패니언 문구 카탈로그를 새로 쓴다 |
| `android/` | Gradle 라이브러리 `ai.hey:tokens-compose` (`HeyTokens.kt`, 차량 앱이 아직 쓰는 `ProtocolVersion.kt`) |

패키지·Kotlin 이름(`hey-*`, `ai.hey.*`)은 앱 이름이 확정될 때까지 바꾸지 않는다.

## 글꼴과 라이선스

글꼴은 Chiron GoRound TC(SIL OFL 1.1)다. 웹은 `packages/tokens/fonts/ChironGoRoundTC-KoreanLatin.woff2`(가변 wght 200–900), 안드로이드는 같은 글꼴의 가변 TTF 하나(`android/src/main/res/font/chiron_goround_tc_variable.ttf`, wght 200–900, 한글 11,172자 전체)를 쓴다. 앱은 `Font(R.font.chiron_goround_tc_variable, variationSettings = FontVariation.Settings(FontVariation.weight(w)))`로 굵기마다 한 항목씩 만든다(minSdk 26 이상). 라이선스 전문은 `packages/tokens/fonts/ChironGoRoundTC-OFL.txt`와 `android/OFL-ChironGoRoundTC.txt`에 글꼴 옆으로 함께 배포한다. 소비 앱은 앱 안(설정의 오픈소스 고지 등)에도 이 고지를 포함해야 한다. 테마는 라이트 '바다', 다크 '심해'이며 라이트 `bg-page`는 `#F0F8FB`다.

가변 TTF는 스튜디오 woff2에서 `fontTools.ttLib.TTFont`로 `flavor = None` 후 저장해 만든다(부분 글꼴·인스턴스 고정 없음).

## 소비 방식

레지스트리 게시 없이 소비 저장소(`companion-server`, `companion-web`, `companion-car`, `companion-e2e`)가 이 저장소를 git 서브모듈 `shared/`로 두고 태그에 고정한다. 태그는 `v0.1.0`부터 새로 시작한다.

```sh
git submodule add git@github.com:teamhey-challenge/companion-shared.git shared
git -C shared checkout v0.1.0
```

- JS: `"@darren-pleos-challenge/hey-tokens": "file:shared/packages/tokens"`
- Android: `settings.gradle.kts`에 `includeBuild("shared/android")`

## 로컬 점검

CI는 두지 않는다.

```sh
bun install
bun run check          # 토큰 시험 + 생성물이 최신인지
cd android && nice -n 19 ./gradlew --max-workers=2 :assembleRelease
```

테마 토큰 대비는 `packages/tokens/scripts/contrast.test.mjs`가 시험한다.

## 스튜디오와 토큰 동기화

토큰 값의 정본은 디자인 스튜디오 `hey-companion-ui`의 `shared/packages/tokens/hey.tokens.json`(main)이다. 이 저장소의 `packages/tokens/hey.tokens.json`은 그 사본이며, 어긋나면 `bun run check`가 실패한다.

```sh
bun run check:studio    # gh api 로 스튜디오 main 파일을 받아 토큰 단위로 비교
STUDIO_TOKENS_STRICT=1 bun run check:studio   # gh 가 없거나 못 받으면 건너뛰지 않고 실패
```

`gh` 가 없거나 로그인·네트워크가 안 되면 안내만 찍고 건너뛴다(오프라인 안전). 야간 점검에는 위 명령을 쓴다. 스튜디오가 바뀌면 파일을 그대로 복사 → `bun run tokens` → PR → 태그 → 소비 앱 서브모듈 올리기 순서로 반영한다.

## 링크

| 저장소 | 내용 |
|---|---|
| [companion-car](https://github.com/teamhey-challenge/companion-car) | 차량 앱 |
| [companion-phone](https://github.com/teamhey-challenge/companion-phone) | 폰 앱(QR 연결·동의·기억 관리) |
| [companion-server](https://github.com/teamhey-challenge/companion-server) | 대화·기억·TTS 서버 |
| [companion-web](https://github.com/teamhey-challenge/companion-web) | 폰 웹·디자인 시스템 Storybook |
| [companion-shared](https://github.com/teamhey-challenge/companion-shared) | 디자인 토큰·프로토콜(이 저장소) |

## 라이선스

코드는 MIT(`LICENSE`). 글꼴 Chiron GoRound TC는 SIL OFL 1.1이며 전문은 글꼴 옆 `*OFL*.txt`에 있다.
