# © 2026 티쳐무 · 모든 권리 보유 — 고등학교 「소프트웨어와 생활」 웹 교과서
#
# 그림 받기 준비 — 학생 코드보다 먼저, 맷플롯립을 쓰는 예제에서만 한 번 돈다.
#
# 브라우저 실행기(py-worker.js)와 예제 점검기(tools/check-examples.mjs)가 이 파일 하나를
# 함께 쓴다. 그래야 «점검기가 확인한 그림»과 «학생 화면에 뜨는 그림»이 같은 설정으로 나온다.
#
#  ① 화면 없는 그리기 장치(Agg)로 그린다 — 워커·점검기에는 창이 없다
#  ② 한글 글꼴(나눔고딕, SIL OFL)을 등록한다 — 없으면 한글이 네모(□)로 나온다
#  ③ plt.show() 를 «그림을 PNG 로 만들어 보내기»로 바꾼다
#
# 학생 코드에는 이 준비가 보이지 않는다. 코랩에서는 ①②가 필요 없고(③은 저절로 된다),
# 한글 글꼴만 따로 설치해야 한다 — 3단원 6차시 본문에 적어 두었다.


def _준비(보내기, 글꼴경로):
    import base64
    import io

    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib import font_manager

    try:
        font_manager.fontManager.addfont(글꼴경로)
        # 나눔고딕에 없는 기호(℃ 등)는 맷플롯립 기본 글꼴(DejaVu Sans)로 넘어가 그린다
        plt.rcParams["font.family"] = [font_manager.FontProperties(fname=글꼴경로).get_name(), "DejaVu Sans"]
    except Exception:  # 글꼴을 못 받아도 그림은 그린다 (한글만 네모로 나온다)
        pass
    plt.rcParams["axes.unicode_minus"] = False  # 음수 기호가 네모로 나오지 않게
    plt.rcParams["figure.dpi"] = 100

    def show(*_a, **_k):
        for n in plt.get_fignums():
            buf = io.BytesIO()
            plt.figure(n).savefig(buf, format="png", bbox_inches="tight")
            보내기(base64.b64encode(buf.getvalue()).decode("ascii"))
        plt.close("all")

    plt.show = show
    return show
