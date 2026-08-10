import { writeFile } from "node:fs/promises";

const tabs = await fetch("http://127.0.0.1:9223/json").then((response) => response.json());
const page = tabs.find((item) => item.type === "page" && item.url.startsWith("http://127.0.0.1:4173"));
if (!page) throw new Error("Demo page was not found in the headless browser.");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let messageId = 0;
const pending = new Map();
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message));
  else resolve(message.result);
});

function command(method, params = {}) {
  const id = ++messageId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

async function evaluate(expression) {
  const response = await command("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (response.exceptionDetails) throw new Error(JSON.stringify(response.exceptionDetails));
  return response.result.value;
}

await command("Runtime.enable");
await command("Storage.clearDataForOrigin", {
  origin: "http://127.0.0.1:4173",
  storageTypes: "local_storage",
});
await command("Page.reload", { ignoreCache: true });
await new Promise((resolve) => setTimeout(resolve, 400));
await command("Emulation.setDeviceMetricsOverride", { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
const checks = [];
function check(name, passed, detail = "") {
  checks.push({ name, passed: Boolean(passed), detail });
}

check("four mode tabs", await evaluate(`document.querySelectorAll('.mode-tab').length`) === 4);
const formalShell = await evaluate(`(() => ({ title: document.title, brand: document.querySelector('.brand-block h1').textContent, guideSteps: document.querySelectorAll('.quick-start span').length, focusMode: Boolean(document.querySelector('.focus-notice')), navItems: document.querySelectorAll('.section-nav button').length, focusLabel: document.querySelector('#focus-toggle').textContent, projectActions: document.querySelectorAll('.project-menu-panel button').length, format: document.querySelector('#output-format').textContent }))()`);
check("formal shell presents a four-step quick start and defaults to focused shot editing", formalShell.title === 'MiniMax H3 Prompts Studio' && formalShell.brand === 'MiniMax H3 Prompts Studio' && formalShell.guideSteps === 4 && formalShell.focusMode && formalShell.navItems === 3 && formalShell.focusLabel === '打开完整设置' && formalShell.projectActions === 4 && formalShell.format.includes('官方六字段'), JSON.stringify(formalShell));
const focusSwitch = await evaluate(`(() => { const before = document.querySelector('#prompt-output').textContent; document.querySelector('#focus-toggle').click(); return { preserved: before === document.querySelector('#prompt-output').textContent, fullSections: document.querySelectorAll('.section-nav button').length, button: document.querySelector('#focus-toggle').textContent, hiddenNotice: !document.querySelector('.focus-notice') }; })()`);
check("focused and full views preserve the same prompt data", focusSwitch.preserved && focusSwitch.fullSections === 7 && focusSwitch.button === '只看分镜' && focusSwitch.hiddenNotice, JSON.stringify(focusSwitch));
await evaluate(`document.querySelector('#load-sample').click()`);
const refPresetCatalog = await evaluate(`(() => { const select = document.querySelector('#task-preset-select'); return { options: [...select.options].map((option) => option.value).filter(Boolean), groups: [...select.querySelectorAll('optgroup')].map((group) => group.label), hasSave: Boolean(document.querySelector('#task-preset-save')), hasDelete: Boolean(document.querySelector('#task-preset-delete')) }; })()`);
check("Ref2VA exposes one generic preset, special presets, and custom-preset controls", refPresetCatalog.options.includes('ref-general') && refPresetCatalog.options.includes('video-character-replacement') && refPresetCatalog.options.length >= 4 && refPresetCatalog.groups.includes('通用') && refPresetCatalog.groups.includes('特别') && refPresetCatalog.hasSave && refPresetCatalog.hasDelete, JSON.stringify(refPresetCatalog));
const monochromeTheme = await evaluate(`(() => { const body = getComputedStyle(document.body); const tab = getComputedStyle(document.querySelector('.mode-tab.active')); const input = document.querySelector('input[data-global="duration"]').getBoundingClientRect(); const button = document.querySelector('#focus-toggle').getBoundingClientRect(); return { bodyBackground: body.backgroundColor, backgroundImage: body.backgroundImage, activeBackground: tab.backgroundColor, activeColor: tab.color, inputHeight: input.height, buttonHeight: button.height }; })()`);
check("monochrome UI uses high-contrast controls without decorative gradients", monochromeTheme.bodyBackground === 'rgb(8, 8, 8)' && monochromeTheme.backgroundImage === 'none' && monochromeTheme.activeBackground === 'rgb(255, 255, 255)' && monochromeTheme.activeColor === 'rgb(0, 0, 0)' && monochromeTheme.inputHeight >= 40 && monochromeTheme.buttonHeight >= 36, JSON.stringify(monochromeTheme));
await evaluate(`new Promise((resolve) => setTimeout(resolve, 1900))`);
const desktopCapture = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
await writeFile(new URL("demo-screenshot.png", import.meta.url), Buffer.from(desktopCapture.data, "base64"));
const helpCoverage = await evaluate(`(() => { const keys = new Set([...document.querySelectorAll('.help-trigger[data-help-key]')].map((item) => item.dataset.helpKey)); const required = ['taskPreset','definitionTemplates','duration','customStyle','refPicture','refVideo','refAudio','referenceDefinition','referenceContext','referenceRelation','referenceRetention','subjectDefinition','subjectAppears','subjectRelation','subjectRetention','summaryContent','shotStartFixed','shotStart','shotPrefix','shotContent','shotReferences','soundscape','noMusic','task-reference generation','task-video editing','style-live-action','style-cinematic']; return { count: document.querySelectorAll('.help-trigger[data-help-key]').length, missing: required.filter((key) => !keys.has(key)) }; })()`);
check("all major parameters expose help triggers", helpCoverage.count >= 45 && helpCoverage.missing.length === 0, JSON.stringify(helpCoverage));
const helpLayout = await evaluate(`(() => { const workspaceBefore = document.querySelector('.workspace').getBoundingClientRect(); const trigger = document.querySelector('.field-help[data-help-key="duration"]'); trigger.dispatchEvent(new PointerEvent('pointerover', { bubbles: true })); const popover = document.querySelector('#help-popover').getBoundingClientRect(); const workspaceAfter = document.querySelector('.workspace').getBoundingClientRect(); return { title: document.querySelector('#help-title').textContent, hidden: document.querySelector('#help-popover').hidden, rows: document.querySelectorAll('#help-body section').length, inViewport: popover.left >= 0 && popover.top >= 0 && popover.right <= innerWidth && popover.bottom <= innerHeight, layoutStable: workspaceBefore.left === workspaceAfter.left && workspaceBefore.width === workspaceAfter.width }; })()`);
check("hover help is detailed, floating, and layout-neutral", !helpLayout.hidden && helpLayout.title === '总时长（秒）' && helpLayout.rows === 4 && helpLayout.inViewport && helpLayout.layoutStable, JSON.stringify(helpLayout));
await evaluate(`document.querySelector('.field-help[data-help-key="duration"]').dispatchEvent(new PointerEvent('pointerout', { bubbles: true })); new Promise((resolve) => setTimeout(resolve, 180))`);
check("unfixed hover help closes automatically", await evaluate(`document.querySelector('#help-popover').hidden`));
const optionHelp = await evaluate(`(() => { const input = document.querySelector('[data-task-type="reference generation"]'); const before = input.checked; input.closest('.check-option').querySelector('.help-trigger').click(); return { unchanged: input.checked === before, pinned: document.querySelector('#help-popover').classList.contains('pinned'), title: document.querySelector('#help-title').textContent }; })()`);
check("click pins help without toggling its parameter", optionHelp.unchanged && optionHelp.pinned && optionHelp.title === 'reference generation', JSON.stringify(optionHelp));
await evaluate(`document.body.click()`);
check("outside click closes pinned help", await evaluate(`document.querySelector('#help-popover').hidden`));
const verticalNav = await evaluate(`(() => { const nav = document.querySelector('.section-nav').getBoundingClientRect(); const sections = document.querySelector('.editor-sections').getBoundingClientRect(); const buttons = [...document.querySelectorAll('.section-nav button')].map((item) => item.getBoundingClientRect()); return { navRight: nav.right, sectionsLeft: sections.left, sameColumn: buttons.every((item) => Math.abs(item.left - buttons[0].left) < 1), descending: buttons.every((item, index) => index === 0 || item.top > buttons[index - 1].top), position: getComputedStyle(document.querySelector('.section-nav')).position }; })()`);
check("step navigation is a non-overlapping left rail", verticalNav.navRight <= verticalNav.sectionsLeft && verticalNav.sameColumn && verticalNav.descending && verticalNav.position === 'sticky', JSON.stringify(verticalNav));
check("first section is highlighted initially", await evaluate(`document.querySelector('.section-nav button.active')?.dataset.target === 'section-duration'`));
const jumpResult = await evaluate(`(async () => { const pageY = window.scrollY; document.querySelector('.section-nav button[data-target="section-shots"]').click(); await new Promise((resolve) => setTimeout(resolve, 600)); const root = document.querySelector('#editor-root').getBoundingClientRect(); const target = document.querySelector('#section-shots').getBoundingClientRect(); return { scrollTop: document.querySelector('#editor-root').scrollTop, offset: Math.abs(target.top - root.top), active: document.querySelector('.section-nav button.active')?.dataset.target, pageMoved: Math.abs(window.scrollY - pageY) }; })()`);
check("left rail scrolls only the editor and tracks the active section", jumpResult.scrollTop > 0 && jumpResult.offset < 100 && jumpResult.active === 'section-shots' && jumpResult.pageMoved < 1, JSON.stringify(jumpResult));
await evaluate(`(async () => { document.querySelector('.section-nav button[data-target="section-duration"]').click(); await new Promise((resolve) => setTimeout(resolve, 500)); })()`);
check("Ref2VA six-section output", await evaluate(`document.querySelector('#prompt-output').textContent.includes('subject_definitions:') && document.querySelector('#prompt-output').textContent.includes('retention_analysis:') && document.querySelector('#prompt-output').textContent.includes('non_diegetic_music:')`));
check("Ref style appears before Shot 1", await evaluate(`document.querySelector('#prompt-output').textContent.includes('The target video uses a live-action, cinematic visual style.\\n[Shot 1]')`));
await evaluate(`document.querySelector('[data-action="apply-style-mix"][data-style-values="watercolor|vintage film"]').click()`);
check("style mix updates prompt", await evaluate(`document.querySelector('#prompt-output').textContent.includes('The target video uses a watercolor, vintage film visual style.')`));
await evaluate(`(() => { const input = document.querySelector('[data-global="customStyle"]'); input.value = 'soft lighting'; input.dispatchEvent(new Event('input', { bubbles: true })); })()`);
check("custom style readout updates while typing", await evaluate(`document.querySelector('.style-result code').textContent === 'watercolor, vintage film, soft lighting' && document.querySelector('#prompt-output').textContent.includes('watercolor, vintage film, soft lighting visual style')`));

await evaluate(`document.querySelector('[data-action="add-subject"]').click()`);
check("add Subject renumbers automatically", await evaluate(`document.querySelectorAll('[data-entity="subjects"][data-key="definition"]').length`) === 3);
check("Subject 3 appears in output", await evaluate(`document.querySelector('#prompt-output').textContent.includes('<Subject 3>')`));
check("Shot reference guide is visible", await evaluate(`document.querySelector('.reference-guide')?.textContent.includes('Shot 里怎么引用')`));
const referenceHelp = await evaluate(`(() => { const trigger = document.querySelector('.guide-help[data-help-key="shotReferences"]'); trigger.click(); const body = document.querySelector('#help-body'); return { title: document.querySelector('#help-title').textContent, pinned: document.querySelector('#help-popover').classList.contains('pinned'), sections: body.querySelectorAll('section').length, examples: body.querySelectorAll('code').length, hasSubject: body.textContent.includes('<Subject 1>'), hasPicture: body.textContent.includes('<Picture 1>'), hasVideo: body.textContent.includes('<Video 1>'), hasAudio: body.textContent.includes('<Audio 1>'), hasI2VA: body.textContent.includes('I2VA'), hasFL2VA: body.textContent.includes('FL2VA') }; })()`);
check("Shot reference tutorial covers every official reference role", referenceHelp.title === 'Shot 引用完整用法' && referenceHelp.pinned && referenceHelp.sections === 9 && referenceHelp.examples >= 7 && referenceHelp.hasSubject && referenceHelp.hasPicture && referenceHelp.hasVideo && referenceHelp.hasAudio && referenceHelp.hasI2VA && referenceHelp.hasFL2VA, JSON.stringify(referenceHelp));
await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
check("Ref Shot exposes quick reference buttons", await evaluate(`document.querySelectorAll('[data-action="insert-token"]').length >= 5`));
await evaluate(`(() => { const area = document.querySelector('[data-entity="shots"][data-key="content"]'); area.focus(); area.setSelectionRange(area.value.length, area.value.length); const button = [...document.querySelectorAll('[data-action="insert-token"]')].find((item) => item.dataset.token === '<Subject 3>'); button.click(); })()`);
check("quick reference inserts at Shot cursor", await evaluate(`document.querySelector('[data-entity="shots"][data-key="content"]').value.endsWith('<Subject 3>') && document.querySelector('#prompt-output').textContent.includes('<Subject 3>')`));

const subjectTemplate = await evaluate(`(() => { const subject = [...document.querySelectorAll('[data-entity="subjects"][data-key="definition"]')].at(-1); const card = subject.closest('.item-card'); card.querySelector('[data-action="apply-subject-template"][data-template="scene"]').click(); const output = document.querySelector('#prompt-output').textContent; return { definition: [...document.querySelectorAll('[data-entity="subjects"][data-key="definition"]')].at(-1).value, picture3: [...document.querySelectorAll('.reference-chip')].some((item) => item.textContent.trim() === '<Picture 3>'), retention: output.includes('<Subject 3> (appears in [Shot 1], [Shot 2]): fully_preserved - the spatial layout') }; })()`);
check("Subject template fills definition and retention while adding its Picture label", subjectTemplate.definition.includes('is the environment in <Picture 3>') && subjectTemplate.picture3 && subjectTemplate.retention, JSON.stringify(subjectTemplate));
const referenceTemplate = await evaluate(`(() => { const pictureCard = document.querySelector('.reference-editor-card'); pictureCard.querySelector('summary').click(); pictureCard.querySelector('[data-action="apply-reference-template"][data-template="picture-keyframe"]').click(); const output = document.querySelector('#prompt-output').textContent; return { definition: output.includes('<Picture 1> is a concrete keyframe and composition anchor for [Shot 1].'), retention: output.includes('<Picture 1> ([Shot 1] keyframe): fully_preserved') }; })()`);
check("reference template fills independent definition and retention", referenceTemplate.definition && referenceTemplate.retention, JSON.stringify(referenceTemplate));
const replacementPreset = await evaluate(`(() => { window.confirm = () => true; const toolbar = document.querySelector('#task-preset-toolbar'); const select = toolbar.querySelector('#task-preset-select'); select.value = 'video-character-replacement'; select.dispatchEvent(new Event('change', { bubbles: true })); const enabled = !toolbar.querySelector('#task-preset-apply').disabled; const described = toolbar.querySelector('#preset-description').textContent.includes('替换'); toolbar.querySelector('#task-preset-apply').click(); const output = document.querySelector('#prompt-output').textContent; const types = [...document.querySelectorAll('.reference-chip')].map((item) => item.textContent.trim()); return { toolbarAtEditorTop: Boolean(document.querySelector('.editor-pane > #task-preset-toolbar')), enabled, described, references: types, subjects: document.querySelectorAll('[data-entity="subjects"][data-key="definition"]').length, videoDetailsOpen: Boolean(document.querySelector('.reference-editor-card details[open]')), taskPrefix: output.includes('[video editing + reference generation]'), genericSubject: output.includes('<Subject 1> is the replacement character whose identity'), videoDefinition: output.includes('<Video 1> is the source video for the target video edit'), videoRetention: output.includes('<Video 1> (source video structure used throughout [Shot 1]): partially_preserved'), directEdit: output.includes('direct edit of <Video 1> from its first frame through its final frame'), genderNeutral: !/woman|female|naked|without clothing/i.test(output), subjectTwoAbsent: !output.includes('<Subject 2>'), silent: output.includes('overall_soundscape:\\nN/A') && output.endsWith('non_diegetic_music:\\nN/A') }; })()`);
check("generic character-replacement preset is explained at the editor top and builds valid Ref2VA", replacementPreset.toolbarAtEditorTop && replacementPreset.enabled && replacementPreset.described && replacementPreset.references.join('|') === '<Picture 1>|<Video 1>' && replacementPreset.subjects === 1 && replacementPreset.videoDetailsOpen && replacementPreset.taskPrefix && replacementPreset.genericSubject && replacementPreset.videoDefinition && replacementPreset.videoRetention && replacementPreset.directEdit && replacementPreset.genderNeutral && replacementPreset.subjectTwoAbsent && replacementPreset.silent, JSON.stringify(replacementPreset));

const customPresetLifecycle = await evaluate(`(() => {
  window.prompt = () => '我的角色替换';
  window.confirm = () => true;
  const savedOutput = document.querySelector('#prompt-output').textContent;
  document.querySelector('#task-preset-save').click();
  let select = document.querySelector('#task-preset-select');
  const customOption = [...select.options].find((option) => option.textContent === '我的角色替换');
  const saved = Boolean(customOption) && select.value === customOption.value && !document.querySelector('#task-preset-delete').disabled;
  const duration = document.querySelector('input[data-global="duration"]');
  duration.value = '12.00';
  duration.dispatchEvent(new Event('input', { bubbles: true }));
  select = document.querySelector('#task-preset-select');
  select.value = customOption.value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  document.querySelector('#task-preset-apply').click();
  const restored = document.querySelector('#prompt-output').textContent === savedOutput && document.querySelector('input[data-global="duration"]').value === '8.00';
  select = document.querySelector('#task-preset-select');
  select.value = customOption.value;
  select.dispatchEvent(new Event('change', { bubbles: true }));
  document.querySelector('#task-preset-delete').click();
  const deleted = ![...document.querySelector('#task-preset-select').options].some((option) => option.value === customOption.value);
  return { saved, restored, deleted };
})()`);
check("custom presets can be saved, applied as a full snapshot, and deleted", customPresetLifecycle.saved && customPresetLifecycle.restored && customPresetLifecycle.deleted, JSON.stringify(customPresetLifecycle));
const refGeneralPreset = await evaluate(`(() => { window.confirm = () => true; const select = document.querySelector('#task-preset-select'); select.value = 'ref-general'; select.dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('#task-preset-apply').click(); const output = document.querySelector('#prompt-output').textContent; return { sixFields: ['subject_definitions:','summary:','retention_analysis:','detailed_description:','overall_soundscape:','non_diegetic_music:'].every((field) => output.includes(field)), picture: output.includes('<Picture 1>'), subject: output.includes('<Subject 1>'), errors: document.querySelectorAll('.status-pill.error').length }; })()`);
check("Ref2VA generic preset is immediately format-valid", refGeneralPreset.sixFields && refGeneralPreset.picture && refGeneralPreset.subject && refGeneralPreset.errors === 0, JSON.stringify(refGeneralPreset));
const normativeValidation = await evaluate(`(() => { const area = document.querySelector('[data-entity="shots"][data-key="content"]'); area.value = '[Shot 1] 近景，角色看向门口。'; area.dispatchEvent(new Event('input', { bubbles: true })); const text = document.querySelector('#validation').textContent; const result = { chinese: text.includes('含中文描述'), duplicate: text.includes('重复手写'), friendlyState: text.includes('结构可用，建议检查'), detailed: document.querySelectorAll('.validation-list li').length >= 2 }; const select = document.querySelector('#task-preset-select'); select.value = 'ref-general'; select.dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('#task-preset-apply').click(); return result; })()`);
check("formal validator explains Chinese body text and duplicate Shot prefixes", normativeValidation.chinese && normativeValidation.duplicate && normativeValidation.friendlyState && normativeValidation.detailed, JSON.stringify(normativeValidation));
const phraseInsertion = await evaluate(`(() => { const area = document.querySelector('[data-entity="shots"][data-key="content"]'); area.focus(); area.setSelectionRange(area.value.length, area.value.length); document.querySelector('.phrase-button[data-cursor-back="4"]').click(); return { inserted: area.value.includes('(S1) says: <d>[Chinese] </d>'), caretBeforeClose: area.selectionStart === area.value.lastIndexOf('</d>'), relationReadable: document.querySelector('[data-entity="subjects"][data-key="relation"]').selectedOptions[0].textContent.includes('完整保留') }; })()`);
check("official phrase buttons insert dialogue syntax and place the caret inside the tag", phraseInsertion.inserted && phraseInsertion.caretBeforeClose && phraseInsertion.relationReadable, JSON.stringify(phraseInsertion));
await evaluate(`(() => { const select = document.querySelector('#task-preset-select'); select.value = 'ref-general'; select.dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('#task-preset-apply').click(); })()`);

await evaluate(`document.querySelector('[data-mode="t2va"]').click()`);
const t2PresetCatalog = await evaluate(`(() => [...document.querySelector('#task-preset-select').options].map((option) => option.value).filter(Boolean))()`);
check("T2VA exposes a generic preset and several special presets", t2PresetCatalog.includes('t2va-general') && t2PresetCatalog.includes('t2va-suspense') && t2PresetCatalog.includes('t2va-dialogue') && t2PresetCatalog.includes('t2va-product') && t2PresetCatalog.length >= 4, JSON.stringify(t2PresetCatalog));
check("T2VA uses three-field body", await evaluate(`document.querySelector('#prompt-output').textContent.startsWith('integrated_multimodal_description:')`));
check("base-mode style uses the official Shot 1 opening", await evaluate(`document.querySelector('#prompt-output').textContent.includes('[Shot 1] Live-action, cinematic,')`));
const suspensePreset = await evaluate(`(() => { window.confirm = () => true; const select = document.querySelector('#task-preset-select'); select.value = 't2va-suspense'; select.dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('#task-preset-apply').click(); const output = document.querySelector('#prompt-output').textContent; return { shots: document.querySelectorAll('[data-entity="shots"][data-key="content"]').length, hasCloseSuspense: output.includes('half-open door') && output.includes('door handle'), noRefFields: !output.includes('subject_definitions:'), noMusic: output.endsWith('non_diegetic_music:\\nN/A') }; })()`);
check("T2VA suspense preset applies a valid three-shot close-coverage structure", suspensePreset.shots === 3 && suspensePreset.hasCloseSuspense && suspensePreset.noRefFields && suspensePreset.noMusic, JSON.stringify(suspensePreset));
const t2GeneralPreset = await evaluate(`(() => { const select = document.querySelector('#task-preset-select'); select.value = 't2va-general'; select.dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('#task-preset-apply').click(); const output = document.querySelector('#prompt-output').textContent; return { fields: output.startsWith('integrated_multimodal_description:') && output.includes('overall_soundscape:') && output.endsWith('non_diegetic_music:\\nN/A'), errors: document.querySelectorAll('.status-pill.error').length }; })()`);
check("T2VA generic preset is immediately format-valid", t2GeneralPreset.fields && t2GeneralPreset.errors === 0, JSON.stringify(t2GeneralPreset));

await evaluate(`document.querySelector('[data-mode="i2va"]').click()`);
const i2PresetCatalog = await evaluate(`(() => [...document.querySelector('#task-preset-select').options].map((option) => option.value).filter(Boolean))()`);
check("I2VA exposes a generic preset and special motion presets", i2PresetCatalog.includes('i2va-general') && i2PresetCatalog.includes('i2va-micro-motion') && i2PresetCatalog.includes('i2va-reaction') && i2PresetCatalog.length >= 3, JSON.stringify(i2PresetCatalog));
check("I2VA first-frame instruction", await evaluate(`document.querySelector('#prompt-output').textContent.startsWith('For the target video, at 0.00 seconds')`));
const i2GeneralPreset = await evaluate(`(() => { const select = document.querySelector('#task-preset-select'); select.value = 'i2va-general'; select.dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('#task-preset-apply').click(); const output = document.querySelector('#prompt-output').textContent; return { firstFrame: output.startsWith('For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.'), errors: document.querySelectorAll('.status-pill.error').length }; })()`);
check("I2VA generic preset preserves the official first-frame instruction", i2GeneralPreset.firstFrame && i2GeneralPreset.errors === 0, JSON.stringify(i2GeneralPreset));

await evaluate(`document.querySelector('[data-mode="fl2va"]').click()`);
const fl2PresetCatalog = await evaluate(`(() => [...document.querySelector('#task-preset-select').options].map((option) => option.value).filter(Boolean))()`);
check("FL2VA exposes a generic preset and special transition presets", fl2PresetCatalog.includes('fl2va-general') && fl2PresetCatalog.includes('fl2va-emotion') && fl2PresetCatalog.includes('fl2va-transformation') && fl2PresetCatalog.length >= 3, JSON.stringify(fl2PresetCatalog));
check("FL2VA alignment instruction", await evaluate(`document.querySelector('#prompt-output').textContent.startsWith('How the reference pictures align with the target video') && document.querySelector('#prompt-output').textContent.includes('8.00-second mark')`));
const fl2GeneralPreset = await evaluate(`(() => { const select = document.querySelector('#task-preset-select'); select.value = 'fl2va-general'; select.dispatchEvent(new Event('change', { bubbles: true })); document.querySelector('#task-preset-apply').click(); const output = document.querySelector('#prompt-output').textContent; return { alignment: output.startsWith('How the reference pictures align with the target video') && output.includes('<Picture 1>') && output.includes('<Picture 2>'), errors: document.querySelectorAll('.status-pill.error').length }; })()`);
check("FL2VA generic preset preserves official first/last-frame alignment", fl2GeneralPreset.alignment && fl2GeneralPreset.errors === 0, JSON.stringify(fl2GeneralPreset));

await evaluate(`document.querySelector('[data-action="add-shot"]').click()`);
await evaluate(`(() => { const input = document.querySelector('input[data-entity="shots"][data-key="start"]'); input.value = '3'; input.dispatchEvent(new Event('input', { bubbles: true })); const areas = document.querySelectorAll('textarea[data-entity="shots"][data-key="content"]'); areas[1].value = 'the camera cuts to a close-up.'; areas[1].dispatchEvent(new Event('input', { bubbles: true })); })()`);
const finalOutput = await evaluate(`document.querySelector('#prompt-output').textContent`);
check("shot timestamp formatting", finalOutput.includes('[Shot 2] At 00:03.000, the camera cuts to a close-up.'), finalOutput);

const allBuiltInPresets = await evaluate(`(() => {
  window.confirm = () => true;
  const results = [];
  for (const mode of ['ref', 't2va', 'i2va', 'fl2va']) {
    document.querySelector('[data-mode="' + mode + '"]').click();
    const ids = [...document.querySelectorAll('#task-preset-select optgroup:not([label="我的预设"]) option')].map((option) => option.value);
    for (const id of ids) {
      const select = document.querySelector('#task-preset-select');
      select.value = id;
      select.dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('#task-preset-apply').click();
      results.push({ mode, id, errors: document.querySelectorAll('.status-pill.error').length, output: document.querySelector('#prompt-output').textContent.length });
    }
  }
  return results;
})()`);
check("every built-in preset applies without format errors", allBuiltInPresets.length === 14 && allBuiltInPresets.every((item) => item.errors === 0 && item.output > 120), JSON.stringify(allBuiltInPresets));

const workspaceBackup = await evaluate(`(async () => {
  let exportedName = '';
  const originalClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () { exportedName = this.download; };
  document.querySelector('#export-workspace').click();
  HTMLAnchorElement.prototype.click = originalClick;
  const workspace = JSON.parse(localStorage.getItem('h3-prompt-studio-v1'));
  workspace.activeMode = 't2va';
  workspace.focusMode = true;
  workspace.modes.t2va.duration = '9.25';
  const transfer = new DataTransfer();
  transfer.items.add(new File([JSON.stringify({ application: 'MiniMax H3 Prompts Studio', workspace })], 'workspace.json', { type: 'application/json' }));
  const input = document.querySelector('#workspace-file');
  input.files = transfer.files;
  window.confirm = () => true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 250));
  const saved = JSON.parse(localStorage.getItem('h3-prompt-studio-v1'));
  return { exportedName, activeMode: document.querySelector('.mode-tab.active').dataset.mode, focus: Boolean(document.querySelector('.focus-notice')), duration: document.querySelector('input[data-global="duration"]').value, schema: saved.schemaVersion, menuClosed: !document.querySelector('#project-menu').open };
})()`);
check("workspace backup exports JSON and imports a migrated complete workspace", workspaceBackup.exportedName.endsWith('.json') && workspaceBackup.activeMode === 't2va' && workspaceBackup.focus && workspaceBackup.duration === '9.25' && workspaceBackup.schema === 2 && workspaceBackup.menuClosed, JSON.stringify(workspaceBackup));

const desktopLayout = await evaluate(`(() => { const workspace = document.querySelector('.workspace').getBoundingClientRect(); const editor = document.querySelector('.editor-pane').getBoundingClientRect(); const preview = document.querySelector('.preview-pane').getBoundingClientRect(); return { editor: editor.width, preview: preview.width, workspace: workspace.width }; })()`);
check("desktop editor receives more space", desktopLayout.editor > desktopLayout.preview && desktopLayout.editor + desktopLayout.preview <= desktopLayout.workspace + 2, JSON.stringify(desktopLayout));

await evaluate(`(() => { document.querySelector('[data-mode="ref"]').click(); document.querySelector('#load-sample').click(); document.querySelector('#editor-root').scrollTop = 0; window.scrollTo(0, 0); })()`);
await command("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await evaluate(`new Promise((resolve) => setTimeout(resolve, 1900))`);
const mobileCapture = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
await writeFile(new URL("demo-mobile-screenshot.png", import.meta.url), Buffer.from(mobileCapture.data, "base64"));
const mobileLayout = await evaluate(`(() => { const nav = document.querySelector('.section-nav').getBoundingClientRect(); const sections = document.querySelector('.editor-sections').getBoundingClientRect(); return { bodyWidth: document.body.scrollWidth, viewport: document.documentElement.clientWidth, columns: getComputedStyle(document.querySelector('.workspace')).gridTemplateColumns, labelDisplay: getComputedStyle(document.querySelector('.nav-label')).display, navRight: nav.right, sectionsLeft: sections.left }; })()`);
check("mobile layout keeps a compact rail without overflow", mobileLayout.bodyWidth <= mobileLayout.viewport && !mobileLayout.columns.includes(' ') && mobileLayout.labelDisplay === 'none' && mobileLayout.navRight <= mobileLayout.sectionsLeft, JSON.stringify(mobileLayout));
const mobileHelp = await evaluate(`(() => { const trigger = document.querySelector('.field-help[data-help-key="shotContent"]'); trigger.click(); const rect = document.querySelector('#help-popover').getBoundingClientRect(); return { visible: !document.querySelector('#help-popover').hidden, left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom, width: rect.width, viewportWidth: innerWidth, viewportHeight: innerHeight }; })()`);
check("mobile help card stays inside the viewport", mobileHelp.visible && mobileHelp.left >= 0 && mobileHelp.top >= 0 && mobileHelp.right <= mobileHelp.viewportWidth && mobileHelp.bottom <= mobileHelp.viewportHeight, JSON.stringify(mobileHelp));
await evaluate(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`);
check("Escape closes parameter help", await evaluate(`document.querySelector('#help-popover').hidden`));
await command("Emulation.clearDeviceMetricsOverride");

socket.close();
const failed = checks.filter((item) => !item.passed);
console.log(JSON.stringify({ passed: checks.length - failed.length, failed: failed.length, checks }, null, 2));
if (failed.length) process.exitCode = 1;
