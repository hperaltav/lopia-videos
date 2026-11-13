import parts
P = parts.PARTS
main = open('brackets_main.js').read()
main = main.replace('__BASE__', P['base']).replace('__CHARS__', P['chars']).replace('__OUTLINE__', P['outline'])
css_extra = """
  .tag{position:absolute;left:540px;font-family:'Inter';font-weight:900;font-size:64px;letter-spacing:2px;background:#fff;
    border:6px solid #1d1b2a;border-radius:28px;padding:18px 40px;box-shadow:0 12px 0 #d9cfbd;opacity:0;white-space:nowrap;}
  #cta{position:absolute;inset:0;opacity:0;background:#f5efe3;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:'Inter';}
  #cta img{width:820px;}
  #cta .q{font-weight:800;font-size:66px;color:#1d1b2a;margin-bottom:60px;letter-spacing:-1.5px;text-align:center;padding:0 60px;}
  #cta .btn{margin-top:70px;background:linear-gradient(90deg,#d8a596,#c98d7e);color:#fff;font-weight:800;font-size:58px;padding:34px 64px;border-radius:999px;box-shadow:0 14px 0 #a86f62;}
  .lbl{font-size:58px !important;background:#fff;padding:8px 22px;border-radius:999px;border:4px solid currentColor;-webkit-text-stroke:0 !important;}
  #flash{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none;}
</style>"""
css = P['css'].rstrip()
if css.endswith('</style>'): css = css[:-8]
html = f"""<!DOCTYPE html><html><head><meta charset="utf-8">
{css}{css_extra}
<script type="importmap">{{"imports":{{"three":"./node_modules/three/build/three.module.js"}}}}</script>
</head><body>
<div style="position:absolute;left:-9999px;font-family:Inter"><b style="font-weight:700">a</b><b style="font-weight:800">a</b><b style="font-weight:900">a</b><span style="font-family:'DejaVu Sans Mono';font-weight:700">a</span><span style="font-family:'DejaVu Sans Mono'">a</span></div>
<div id="stage">
  <canvas id="c" width="1080" height="1920"></canvas>
  <div id="flash"></div>
  <div class="tag" id="typeTag" style="top:150px;color:#0f8f86">METÁLICOS</div>
  <div class="tag" id="ses1" style="top:230px;color:#0f8f86">UNA SOLA SESIÓN</div>
  <div class="tag" id="ses2" style="top:1262px;color:#2f5f86;font-size:46px">DEPENDE DE CADA CASO</div>
  <div id="labels"></div>
  <div id="caption"></div>
  <div id="cta">
    <div class="q" id="ctaq">¿Quieres mejorar tu sonrisa?</div>
    <img id="ctalogo" src="logo2.svg">
    <div class="btn" id="ctabtn">Agenda tu evaluación</div>
  </div>
</div>
<script type="module">
{P['utils'].replace('DURATION = 46.5', 'DURATION = 52.2')}
{main}
</script></body></html>"""
open('brackets.html','w').write(html)
