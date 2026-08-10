(() => {
  "use strict";

  const STORAGE_KEY = "minimax-h3-prompts-studio-v1";
  const LEGACY_STORAGE_KEY = "h3-prompt-studio-v1";
  const APP_VERSION = "1.3.0";
  const SCHEMA_VERSION = 2;
  const MODE_META = {
    ref: {
      title: "全能参考",
      badge: "Ref2VA",
      filename: "ref2va-prompt.txt",
      guidance: "有图片、视频或音频参考时使用；模板会先准备引用关系，你通常只需要修改分镜。",
      format: "Ref2VA · 官方六字段",
    },
    t2va: {
      title: "文生视频",
      badge: "T2VA",
      filename: "t2va-prompt.txt",
      guidance: "不需要参考素材，直接用英文描述完整的画面、动作、摄影机与声音时间线。",
      format: "T2VA · 官方三字段",
    },
    i2va: {
      title: "图生视频",
      badge: "I2VA",
      filename: "i2va-prompt.txt",
      guidance: "Picture 1 是视频 0 秒首帧；先保持原图内容，再描述画面如何自然向后发展。",
      format: "I2VA · 首帧指令＋三字段",
    },
    fl2va: {
      title: "首尾帧视频",
      badge: "FL2VA",
      filename: "fl2va-prompt.txt",
      guidance: "Picture 1 是开头、Picture 2 是结尾；重点描述两张图之间连续可见的变化路径。",
      format: "FL2VA · 首尾帧对齐＋三字段",
    },
  };
  const TASK_TYPES = [
    "reference generation",
    "keyframe completion",
    "video editing",
    "video continuation",
    "audio reuse",
    "audio reference",
  ];
  const TASK_TYPE_LABELS = {
    "reference generation": "参考生成",
    "keyframe completion": "关键帧补全",
    "video editing": "视频编辑",
    "video continuation": "视频续写",
    "audio reuse": "音频复用",
    "audio reference": "音频参考",
  };
  const VISUAL_RELATIONS = [
    "fully_preserved",
    "partially_preserved",
    "attribute_transfer",
    "weak_reference",
  ];
  const AUDIO_RELATIONS = [
    "fully_copy",
    "partially_copy",
    "reference",
    "weak_reference",
  ];
  const RELATION_LABELS = {
    fully_preserved: "完整保留 · fully_preserved",
    partially_preserved: "部分保留 · partially_preserved",
    attribute_transfer: "属性迁移 · attribute_transfer",
    weak_reference: "弱参考 · weak_reference",
    fully_copy: "完整复制 · fully_copy",
    partially_copy: "部分复制 · partially_copy",
    reference: "参考特征 · reference",
  };
  const STYLE_PRESETS = [
    { value: "live-action", label: "真人实拍", note: "Live-action" },
    { value: "cinematic", label: "电影感", note: "Cinematic" },
    { value: "2D-animated", label: "二维动画", note: "2D-animated" },
    { value: "3D CG", label: "三维CG", note: "3D CG" },
    { value: "claymation", label: "黏土动画", note: "Claymation" },
    { value: "watercolor", label: "水彩", note: "Watercolor" },
    { value: "vintage film", label: "复古胶片", note: "Vintage film" },
  ];
  const STYLE_MIXES = [
    { label: "写实电影", values: ["live-action", "cinematic"] },
    { label: "二维电影", values: ["2D-animated", "cinematic"] },
    { label: "三维电影", values: ["3D CG", "cinematic"] },
    { label: "水彩胶片", values: ["watercolor", "vintage film"] },
  ];
  const SHOT_LANGUAGE_GROUPS = [
    {
      key: "shot-size",
      title: "景别",
      note: "决定画面看多近",
      items: [
        { label: "近景开场", note: "Close opening", token: "A close shot frames " },
        { label: "大远景", note: "Extreme wide", token: "An extreme wide shot establishes " },
        { label: "远景", note: "Wide", token: "A wide shot frames " },
        { label: "中远景", note: "Medium wide", token: "A medium-wide shot frames " },
        { label: "中景", note: "Medium", token: "A medium shot frames " },
        { label: "中近景", note: "Medium close-up", token: "A medium close-up frames " },
        { label: "近景", note: "Close-up", token: "A close-up frames " },
        { label: "大特写", note: "Extreme close-up", token: "An extreme close-up isolates " },
        { label: "局部特写", note: "Detail shot", token: "A detail shot isolates " },
      ],
    },
    {
      key: "angle",
      title: "视角",
      note: "决定摄影机从哪里看",
      items: [
        { label: "平视", note: "Eye level", token: "The camera holds an eye-level view. " },
        { label: "低角度", note: "Low angle", token: "The camera adopts a low-angle view. " },
        { label: "高角度", note: "High angle", token: "The camera adopts a high-angle view. " },
        { label: "正俯视", note: "Overhead", token: "An overhead view looks straight down at " },
        { label: "贴地仰视", note: "Ground level", token: "A ground-level view looks upward at " },
        { label: "过肩视角", note: "Over shoulder", token: "An over-the-shoulder view frames " },
        { label: "主观视角", note: "POV", token: "A point-of-view shot shows " },
        { label: "倾斜视角", note: "Dutch angle", token: "The camera uses a Dutch angle to frame " },
        { label: "背后视角", note: "Rear view", token: "A rear view frames " },
        { label: "侧面视角", note: "Side view", token: "A side view frames " },
      ],
    },
    {
      key: "composition",
      title: "构图",
      note: "决定主体如何排在画面里",
      items: [
        { label: "居中构图", note: "Centered", token: "The subject is centered in the frame. " },
        { label: "三分构图", note: "Rule of thirds", token: "The subject is placed along the rule-of-thirds grid. " },
        { label: "对称构图", note: "Symmetrical", token: "The composition is strictly symmetrical. " },
        { label: "引导线", note: "Leading lines", token: "Leading lines direct attention toward the subject. " },
        { label: "框中框", note: "Frame within frame", token: "A frame-within-a-frame composition encloses the subject. " },
        { label: "前中后景", note: "Layered depth", token: "Foreground, midground, and background elements create layered depth. " },
        { label: "负空间", note: "Negative space", token: "Generous negative space surrounds the subject. " },
        { label: "浅景深", note: "Shallow depth", token: "A shallow depth of field isolates the subject from the background. " },
        { label: "深焦", note: "Deep focus", token: "Deep focus keeps the foreground and background clearly visible. " },
        { label: "双人构图", note: "Two-shot", token: "A balanced two-shot keeps both subjects visible in the frame. " },
      ],
    },
    {
      key: "camera-motion",
      title: "运镜",
      note: "决定摄影机如何运动",
      items: [
        { label: "固定机位", note: "Static", token: "The camera holds a static shot. " },
        { label: "缓慢推近", note: "Push in", token: "The camera pushes in with small amplitude at slow speed. " },
        { label: "缓慢拉远", note: "Pull out", token: "The camera pulls out with small amplitude at slow speed. " },
        { label: "变焦放大", note: "Zoom in", token: "The camera slowly zooms in. " },
        { label: "变焦缩小", note: "Zoom out", token: "The camera slowly zooms out. " },
        { label: "向左摇摄", note: "Pan left", token: "The camera slowly pans left. " },
        { label: "向右摇摄", note: "Pan right", token: "The camera slowly pans right. " },
        { label: "向左横移", note: "Truck left", token: "The camera slowly trucks left. " },
        { label: "向右横移", note: "Truck right", token: "The camera slowly trucks right. " },
        { label: "向上摇镜", note: "Tilt up", token: "The camera slowly tilts upward. " },
        { label: "向下摇镜", note: "Tilt down", token: "The camera slowly tilts downward. " },
        { label: "机位升高", note: "Pedestal up", token: "The camera slowly rises vertically. " },
        { label: "机位降低", note: "Pedestal down", token: "The camera slowly descends vertically. " },
        { label: "环绕主体", note: "Arc", token: "The camera slowly arcs around the subject. " },
        { label: "跟随运动", note: "Tracking", token: "The camera smoothly tracks alongside the moving subject. " },
        { label: "轻微手持", note: "Slight shake", token: "The camera has subtle natural handheld movement. " },
        { label: "强烈晃动", note: "Strong shake", token: "The camera shakes strongly with the action. " },
        { label: "顺时针旋转", note: "Roll clockwise", token: "The camera slowly rolls clockwise. " },
        { label: "逆时针旋转", note: "Roll counterclockwise", token: "The camera slowly rolls counterclockwise. " },
      ],
    },
  ];
  const SOUND_PRESET_GROUPS = [
    {
      key: "ambience",
      title: "环境声",
      note: "写入 overall_soundscape",
      target: "soundscape",
      items: [
        { label: "室内底噪", note: "Indoor room tone", token: "Natural indoor room tone continues throughout the video." },
        { label: "室外底噪", note: "Outdoor ambience", token: "Natural outdoor ambience continues throughout the video." },
        { label: "夜晚环境", note: "Night ambience", token: "Low nighttime ambience continues beneath the scene." },
        { label: "稳定雨声", note: "Steady rain", token: "Steady rain falls in the background." },
        { label: "轻微风声", note: "Soft wind", token: "Soft wind moves through the environment." },
        { label: "城市交通", note: "Distant traffic", token: "Distant traffic and low city ambience remain audible." },
        { label: "人群背景", note: "Crowd murmur", token: "Low crowd murmur continues in the background." },
        { label: "设备嗡鸣", note: "Ventilation hum", token: "A low ventilation hum continues throughout the scene." },
      ],
    },
    {
      key: "physical-sound",
      title: "动作声",
      note: "与可见物理动作同步",
      target: "soundscape",
      items: [
        { label: "自然脚步", note: "Footsteps", token: "Footsteps sound naturally against the floor." },
        { label: "衣物摩擦", note: "Fabric movement", token: "Soft fabric movement accompanies the character's actions." },
        { label: "物体拿放", note: "Object handling", token: "Subtle object-handling sounds remain synchronized with the visible actions." },
        { label: "开门关门", note: "Door movement", token: "The door hinges move softly before the latch clicks shut." },
        { label: "纸张摩擦", note: "Paper rustle", token: "Paper rustles softly with each movement." },
        { label: "金属碰撞", note: "Metal impact", token: "Small metallic impacts ring out briefly." },
        { label: "明显撞击", note: "Sharp impact", token: "A sharp physical impact is followed by a short decay." },
        { label: "家具轻响", note: "Furniture creak", token: "The furniture creaks softly under shifting weight." },
      ],
    },
    {
      key: "nonverbal-human",
      title: "人物声音",
      note: "非台词、非歌唱的人声",
      target: "soundscape",
      items: [
        { label: "自然呼吸", note: "Breathing", token: "Natural breathing remains close and clearly audible." },
        { label: "急促呼吸", note: "Heavy breathing", token: "Breathing becomes faster and heavier." },
        { label: "轻声叹息", note: "Quiet sigh", token: "A quiet sigh is heard." },
        { label: "自然笑声", note: "Laughter", token: "Brief natural laughter is heard." },
        { label: "压抑抽泣", note: "Sobbing", token: "Quiet sobbing and uneven breathing are audible." },
        { label: "轻微喘息", note: "Panting", token: "Soft panting remains audible at close range." },
        { label: "短促咳嗽", note: "Cough", token: "A brief cough breaks the room tone." },
        { label: "吞咽声", note: "Swallow", token: "A subtle swallow is audible at close range." },
      ],
    },
    {
      key: "music",
      title: "非画面配乐",
      note: "自动关闭“无非叙事配乐”",
      target: "music",
      items: [
        { label: "稀疏钢琴", note: "Piano and strings", token: "Sparse piano notes at a slow tempo are joined by sustained low strings and fade gently at the end." },
        { label: "低频电子", note: "Electronic pulse", token: "A low electronic pulse moves at a slow tempo with restrained dynamics and a short fade at the end." },
        { label: "木吉他", note: "Acoustic guitar", token: "A soft acoustic-guitar pattern plays at a moderate tempo with sparse upright-bass notes." },
        { label: "低音弦乐", note: "Low strings", token: "Sustained low strings move at a slow tempo and gradually increase in volume before receding." },
        { label: "轻柔合成器", note: "Synth pads", token: "Soft sustained synthesizer pads play at a slow tempo with minimal rhythmic movement." },
        { label: "克制鼓点", note: "Percussion", token: "A restrained percussion pattern plays at a moderate tempo with evenly spaced low drum hits." },
        { label: "钢琴渐弱", note: "Piano fade", token: "Widely spaced solo-piano notes play at a slow tempo and gradually decrease in volume." },
        { label: "弦乐渐强", note: "String swell", token: "Sustained strings gradually increase in volume over a slow pulse, then stop cleanly at the end." },
      ],
    },
  ];
  const BUILT_IN_PRESETS = [
    { id: "ref-general", mode: "ref", group: "通用", title: "通用参考生成", description: "Picture 1 定义 Subject 1；自动建立完整六字段，可直接改 Shot。", factory: generalRefPreset },
    { id: "video-character-replacement", mode: "ref", group: "特别", title: "原视频角色替换", description: "用 Picture 1 的角色替换 Video 1 原角色，保留原动作、机位、剪辑、时序、环境和灯光。", factory: videoCharacterReplacementPreset },
    { id: "ref-two-character-scene", mode: "ref", group: "特别", title: "双角色同场", description: "Picture 1、2 定义两个角色，Picture 3 定义场景；预建双人互动分镜。", factory: twoCharacterScenePreset },
    { id: "ref-character-product", mode: "ref", group: "特别", title: "角色＋产品展示", description: "分别锁定角色、产品和场景，用两镜头完成拿起与产品特写。", factory: characterProductPreset },

    { id: "t2va-general", mode: "t2va", group: "通用", title: "通用文生视频", description: "单镜头写实起步结构，已填风格、物理声音和无配乐。", factory: generalT2VAPreset },
    { id: "t2va-suspense", mode: "t2va", group: "特别", title: "近景悬念短片", description: "用近景、局部特写和反应特写推进悬念，避免无意义的大范围跳切。", factory: suspenseT2VAPreset },
    { id: "t2va-dialogue", mode: "t2va", group: "特别", title: "双人中文对话", description: "预建稳定的 (S1)/(S2) 说话者编号和官方中文台词标签。", factory: dialogueT2VAPreset },
    { id: "t2va-product", mode: "t2va", group: "特别", title: "产品广告", description: "产品主镜头、使用动作和材质特写组成的短广告结构。", factory: productT2VAPreset },

    { id: "i2va-general", mode: "i2va", group: "通用", title: "通用图生视频", description: "严格承接 Picture 1 首帧，用一个明确动作自然向后发展。", factory: generalI2VAPreset },
    { id: "i2va-micro-motion", mode: "i2va", group: "特别", title: "人物微动作", description: "保持人物、服装和构图，只增加眨眼、呼吸、视线与轻微推镜。", factory: microMotionI2VAPreset },
    { id: "i2va-reaction", mode: "i2va", group: "特别", title: "察觉与反应", description: "从静态首帧发展为听见动静、停顿、转头的反应镜头。", factory: reactionI2VAPreset },

    { id: "fl2va-general", mode: "fl2va", group: "通用", title: "通用首尾过渡", description: "从 Picture 1 连续运动并准确收敛到 Picture 2。", factory: generalFL2VAPreset },
    { id: "fl2va-emotion", mode: "fl2va", group: "特别", title: "表情状态变化", description: "保持机位和身份稳定，让表情与姿态自然过渡到尾帧。", factory: emotionFL2VAPreset },
    { id: "fl2va-transformation", mode: "fl2va", group: "特别", title: "连续形态转变", description: "用可见的连续变化连接两张图，避免闪切和中途重置。", factory: transformationFL2VAPreset },
  ];
  const HELP_CONTENT = {
    duration: {
      title: "总时长（秒）",
      purpose: "定义目标视频的有效播放长度，并作为所有切镜时间的校验上限。",
      usage: "填写正数秒数，例如 8、8.00 或 12.5。Shot 2 之后的切镜时间必须严格小于这里的数值。",
      output: "T2VA 中只参与时间校验；I2VA 用于完整时间线；FL2VA 还会以两位小数写入 Picture 2 的尾帧对齐指令。",
      caution: "它不是某个 Shot 的持续时间，也不会自动平均分配镜头。",
    },
    lastShot: {
      title: "尾帧所属镜头",
      purpose: "指定 FL2VA 的 Picture 2 最终落在哪个 Shot 的结束位置。",
      usage: "通常单镜头插值选择 Shot 1；只有明确多次切镜时才选择后面的 Shot。",
      output: "会写入首尾帧对齐指令中的“Picture 2 (from Shot N)”。",
      caution: "最后一个 Shot 必须在总时长结束时收敛到 Picture 2，不能只在中途短暂出现。",
    },
    subjectDefinition: {
      title: "Subject 定义内容",
      purpose: "定义一个可在目标视频中反复调用的人物、场景、物体、服装、动作或视觉效果。",
      usage: "写清来源标签和需要识别的稳定特征，例如“is the woman in <Picture 1>, with long black hair...”。",
      output: "工具会自动在句首添加 <Subject N>，并写入 Ref2VA 的 subject_definitions。",
      caution: "Subject 表示可复用的可见内容，不等同于源文件本身；同一 Subject 可以同时来自图片和视频。",
    },
    subjectAppears: {
      title: "出现镜头编号",
      purpose: "声明该 Subject 在哪些目标镜头中出现，供 retention_analysis 使用。",
      usage: "用逗号或空格填写镜头号，例如 1, 2, 4。也可以点击 Subject 区域顶部的“按Shot同步”，根据分镜正文中的 Subject 标签自动填写。",
      output: "自动转换为“appears in [Shot 1], [Shot 2]”格式。",
      caution: "这里只做保留关系登记；Shot 正文仍需在实际出现的位置写入 <Subject N>。登记镜头与正文引用不一致时，校验器会提示。",
    },
    subjectRelation: {
      title: "保留方式",
      purpose: "描述参考可见内容与目标结果之间的保真关系。",
      usage: "fully_preserved=完整保留；partially_preserved=仍是同一内容但部分改变；attribute_transfer=把特征转移给另一主体；weak_reference=只保留宽泛风格、类别或构图相似性。",
      output: "作为固定英文关系标记写入 retention_analysis。",
      caution: "新增剧情、动作或背景不自动代表保真度下降，应只判断定义中的参考特征是否改变。",
    },
    subjectRetention: {
      title: "保留描述",
      purpose: "具体说明哪些身份、外观、空间或材质特征需要保持，以及哪些特征允许变化。",
      usage: "用完整英文句子列出可观察特征，例如脸、发型、服装颜色、关键物体和场景结构。",
      output: "工具会在前面自动添加 <Subject N>、出现镜头和保留方式。",
      caution: "不要只重复 fully_preserved；应写模型能在画面中核对的具体特征。",
    },
    summaryContent: {
      title: "Summary 汇总句",
      purpose: "用短句概括目标视频、主要事件和参考资产的核心关系。",
      usage: "可以拆成多条编辑，最终会按当前顺序连接成一个英文段落，并引用已定义标签。",
      output: "写入 Ref2VA 的 summary，前方自动添加已勾选的任务类型。",
      caution: "不要在这里新建未定义的标签，也不要把它写成逐镜头剧情细节。",
    },
    customStyle: {
      title: "自定义风格词",
      purpose: "补充预设之外的光线、色彩、媒介或影像质感。",
      usage: "建议输入简短英文短语，例如 soft lighting, slightly desaturated color palette。",
      output: "与已勾选风格合并；Ref2VA 写在 Shot 1 之前，基础模式写在 Shot 1 开头。",
      caution: "这里只写视觉风格，不要塞入人物动作、台词或声音。",
    },
    shotStartFixed: {
      title: "Shot 1 开始时间",
      purpose: "表示第一个镜头固定从目标视频 0 秒开始。",
      usage: "该值由格式规则锁定，无需也不能编辑。",
      output: "Shot 1 只输出 [Shot 1]，不会附加 At 时间戳。",
      caution: "不要在 Shot 1 正文中再次手写 At 00:00.000。",
    },
    shotStart: {
      title: "切镜时间",
      purpose: "定义当前 Shot 相对整条目标视频的开始时刻，而不是上一镜头持续了多久。",
      usage: "可输入 3、3.5 或 00:03.500；工具统一输出 MM:SS.mmm。后续 Shot 必须严格递增。",
      output: "自动形成“[Shot N] At 00:03.500,”前缀。",
      caution: "时间必须小于总时长；普通机位轻微移动应优先写摄影机运动，不必强行切镜。",
    },
    shotPrefix: {
      title: "输出前缀",
      purpose: "实时预览工具将为当前镜头自动生成的 Shot 编号和切镜时间格式。",
      usage: "只读，不需要复制进镜头内容。排序或修改切镜时间后会自动更新。",
      output: "直接成为 detailed_description 或 integrated_multimodal_description 中该镜头的开头。",
      caution: "镜头内容不要再次手写 [Shot N] 或 At 时间，否则会重复。",
    },
    shotContent: {
      title: "镜头内容",
      purpose: "描述该镜头中真正可见和可听的内容，是视频提示词的主要正文。",
      usage: "按构图与景别、主体和环境、动作与状态变化、摄影机运动、同步物理声音的顺序写。Ref2VA 在内容实际出现处插入对应标签。",
      output: "Ref2VA 写入 detailed_description；T2VA/I2VA/FL2VA 写入 integrated_multimodal_description。文本原样保留。",
      caution: "说话者使用稳定的 (S1) 编号，台词写成 <d>[Chinese] 原文</d>；Shot 2 以后正文通常从切镜动作继续。",
    },
    shotLanguage: {
      title: "镜头语言库",
      purpose: "提供可直接插入 Shot 正文的标准英文景别、视角、构图和摄影机运动句式。",
      usage: "先把光标放到镜头描述中希望插入的位置，再展开工具箱并点击词条。带未完成宾语的句式会把光标留在末尾，继续填写主体即可。",
      output: "所选英文句式会原样插入当前 Shot，不会改变时间戳、Subject 标签或其他字段。",
      caution: "每个 Shot 只选真正需要的镜头语言；不要同时堆叠互相矛盾的景别、视角或运镜。推拉、摇移等运动通常补充合理速度和幅度即可。",
    },
    speakerIds: {
      title: "Speaker 与台词",
      purpose: "把实际发声者绑定到全局 Speaker 编号，并生成带语言标签的台词格式。",
      usage: "Ref2VA 先选择发言的 Subject，再选择 S1、S2 等编号和语言，点击“插入台词”。第一个实际发声者是 S1，第二个首次发声者是 S2。",
      output: "Ref2VA 插入“<Subject N> (Sx) says, <d>[Language] </d>”；其他模式插入“(Sx) says, <d>[Language] </d>”，光标停在台词内容位置。",
      caution: "Speaker 编号以整条目标视频为范围，不会在每个 Shot 重置；同一发声者跨 Shot 必须沿用原编号。正确写法是圆括号 (S1)，不是 <S1>。每段独立生成的视频重新编号。",
    },
    soundscape: {
      title: "overall_soundscape",
      purpose: "概括整条视频的环境声、物理动作声和非语言人声。",
      usage: "使用 1–4 个连续英文句子，例如室内底噪、雨声、脚步、衣料摩擦、呼吸或撞击。",
      output: "写入 overall_soundscape 字段；具体时刻发生的同步声音仍可同时写在对应 Shot。",
      caution: "不要在这里重复完整台词、歌词或观众才能听见的配乐；只有明确要求全片完全静音时才使用 N/A。",
    },
    soundLibrary: {
      title: "声音快速库",
      purpose: "快速向声音字段插入符合 H3 分类规则的英文环境声、动作声、人物非语言声和非叙事配乐描述。",
      usage: "先将光标放入目标声音输入框，再展开并点击词条。环境声、动作声和人物声音写入 overall_soundscape；配乐词条写入 non_diegetic_music。",
      output: "所选句子会在当前光标处追加。点击配乐词条时，工具会自动关闭“无非叙事配乐”并显示配乐输入框。",
      caution: "台词和歌唱仍应写在对应 Shot 的 <d> 标签内；角色能听见的现场音乐属于叙事内声音，也应写进 Shot，不要放在非画面配乐中。",
    },
    noMusic: {
      title: "无非叙事配乐",
      purpose: "控制是否存在角色听不见、只供观众听见的背景配乐。",
      usage: "开启表示没有非叙事配乐；关闭后填写下方 non_diegetic_music。",
      output: "开启时固定输出“non_diegetic_music: N/A”。",
      caution: "角色能听见的收音机、电视、现场演奏属于叙事内声音，应写进 Shot，而不是这里。",
    },
    music: {
      title: "non_diegetic_music",
      purpose: "描述只供观众听见、角色无法听见的背景配乐。",
      usage: "用 1–3 个英文句子写乐器、速度、节奏和动态变化，例如 sparse piano notes at a slow tempo。",
      output: "写入 non_diegetic_music 字段。",
      caution: "避免只写“悲伤、紧张”等抽象情绪；应描述可听见的音乐特征。",
    },
    refPicture: {
      title: "Picture 参考标签",
      purpose: "添加一张作为具体首帧、关键帧、尾帧、编辑帧或构图锚点的参考图片。",
      usage: "添加后按同类型顺序生成 <Picture N>，可在 Subject 定义、Summary 和 Shot 中引用。",
      output: "只有图片本身承担具体帧锚点时才作为独立 Picture 使用；仅提供人物外观时应在 Subject 定义中引用它。",
      caution: "删除后同类型编号会重排，需检查正文中原有标签是否仍指向正确资产。",
    },
    refVideo: {
      title: "Video 参考标签",
      purpose: "添加提供整段编辑源、续写起点、摄影机运动、切镜节奏或时间结构的参考视频。",
      usage: "添加后生成 <Video N>。视频中的人物、物体或动作若作为可见内容复用，仍应另建 Subject。",
      output: "用于说明源视频级关系，不替代 <Subject N>。",
      caution: "仅仅上传了视频不等于 video editing 或 video continuation，应按实际用途选择任务类型。",
    },
    refAudio: {
      title: "Audio 参考标签",
      purpose: "添加被复制或参考的独立音频信号，例如完整声轨、音色、对白内容、节拍或声音质感。",
      usage: "添加后生成 <Audio N>；若绑定具体说话者，应在定义中复用该说话者的全局 (Sx) 编号。",
      output: "可在声音发生的 Shot、overall_soundscape 或 non_diegetic_music 中引用其对应作用。",
      caution: "参考视频自带声音不会自动生成 Audio 标签；Video 和 Audio 各自独立编号。",
    },
    taskPreset: {
      title: "任务预设",
      purpose: "为当前生成模式一次建立正确字段、镜头结构、引用关系和声音结构，也可以把自己写好的整套内容保存成私人预设。",
      usage: "每种模式都有“通用”起步预设和若干专项预设。选择后点“应用”；点“保存”会把当前模式的全部内容保存为自定义预设；自定义项可以删除。",
      output: "内置或自定义预设应用后都会恢复为普通可编辑字段。Ref2VA 会包含六字段；T2VA、I2VA、FL2VA 会各自遵守对应官方格式。",
      caution: "应用预设会覆盖当前模式内容。自定义预设只保存在当前浏览器本地；清除浏览器站点数据后无法恢复。",
    },
    definitionTemplates: {
      title: "通用定义按钮",
      purpose: "自动填写当前 Subject 或参考资产的定义、出现镜头、保留方式和保留描述，让主要工作集中在 Shot 正文。",
      usage: "Subject 可选择角色身份、完整角色、场景或物体；Picture、Video 和 Audio 会显示各自适用的模板。点击后仍可手动修改。",
      output: "模板直接写入普通编辑字段，并同步更新 subject_definitions 与 retention_analysis。",
      caution: "Subject N 默认对应 Picture N；如果缺少该 Picture，工具会自动补齐标签。模板无法判断剧情中的具体动作，Shot 内容仍需自行填写。",
    },
    referenceDefinition: {
      title: "参考资产定义",
      purpose: "当 Picture、Video 或 Audio 本身需要作为独立参考角色被追踪时，为其生成 subject_definitions 条目。",
      usage: "只填写标签后面的英文内容，例如 Video 可写“is the source video for the target video edit...”。",
      output: "工具自动在句首添加当前 <Picture N>、<Video N> 或 <Audio N> 标签。空白时不会生成独立定义。",
      caution: "图片若只用于定义 Subject 外观，应把 <Picture N> 写进 Subject 定义，不要再建立独立 Picture 定义。",
    },
    referenceContext: {
      title: "保留关系作用范围",
      purpose: "说明该参考资产的保留关系在哪些镜头、结构或声音层中生效。",
      usage: "只写括号内部内容，例如 source video structure used throughout [Shot 1]。",
      output: "自动放在标签后的圆括号中，再连接保留方式和保留描述。",
      caution: "不要在这里重复输入标签、括号、冒号或关系标记。",
    },
    referenceRelation: {
      title: "参考资产保留方式",
      purpose: "定义 Picture、Video 或 Audio 与目标结果之间的保留、转移、复制或参考关系。",
      usage: "Picture/Video 使用视觉关系；Audio 使用 fully_copy、partially_copy、reference 或 weak_reference。",
      output: "作为固定英文标记写入 retention_analysis。",
      caution: "整段人物替换会改变源视频中的演员外观，因此 Video 通常使用 partially_preserved，而不是 fully_preserved。",
    },
    referenceRetention: {
      title: "参考资产保留描述",
      purpose: "具体说明源视频结构、关键帧构图或音频信号中哪些内容保留，哪些内容改变。",
      usage: "用可核对的完整英文句子描述，例如保留时长、机位、动作和环境，但替换原演员身份与服装。",
      output: "与参考标签、作用范围和保留方式共同组成 retention_analysis 条目。",
      caution: "只有需要独立追踪该参考资产时才填写；仅作为 Subject 来源的 Picture 通常保持空白。",
    },
    shotReferences: {
      title: "Shot 引用完整用法",
      sections: [
        {
          label: "核心原则",
          text: "把标签写在参考内容真正出现或生效的位置，并让它成为自然英文句子的一部分。不要把所有标签堆在 Shot 的开头或结尾。",
        },
        {
          label: "Subject",
          text: "人物、场景或物体第一次在当前 Shot 中清楚出现时写标签，同时交代它的位置、可见特征和当前动作。同一 Shot 后续可用 she、he、it 等代词。",
          example: "[Shot 1] A close-up frames <Subject 1> seated beside the window inside <Subject 2>. She slowly turns toward the door.",
        },
        {
          label: "后续 Shot",
          text: "新镜头里再次出现同一主体时继续使用原编号，让模型明确镜头切换后仍是同一对象；无需重新定义标签含义。",
          example: "[Shot 2] At 00:04.000, the camera cuts to <Subject 1> as she lowers her gaze.",
        },
        {
          label: "Picture",
          text: "只有图片本身承担首帧、关键帧、尾帧或构图锚点时，才直接在 Shot 中引用。若图片只提供人物外观，应仅在 Subject 定义里说明来源。",
          example: "The shot begins from <Picture 1>. The shot ends on the exact pose and composition established by <Picture 2>.",
        },
        {
          label: "Video",
          text: "用于源视频的末态、运镜、切镜节奏或整段时间结构。视频中复用的人物和物体仍然使用 Subject，Video 标签不能代替它们。",
          example: "The shot continues from the final state of <Video 1>, preserving its camera direction and pacing.",
        },
        {
          label: "Audio",
          text: "放在声音实际生效的 Shot 或声音阶段。说话人物同时保留 Subject 标签和稳定的说话者编号 (Sx)，台词原文放进 <d>。",
          example: "<Subject 1> (S1) speaks with the voice timbre referenced from <Audio 1>: <d>[Chinese] 你到底在隐瞒什么？</d>",
        },
        {
          label: "Speaker (Sx)",
          text: "S1、S2 按整条目标视频中首次实际发声的顺序分配，不按 Shot 重新开始。同一人物换镜头后继续使用原编号。Ref2VA 中人物发言写成 <Subject N> (Sx)。",
          example: "[Shot 1] <Subject 2> (S1) says... [Shot 3] <Subject 2> (S1) replies...",
        },
        {
          label: "I2VA",
          text: "<Picture 1> 固定为 0 秒首帧。Shot 1 先说明保留参考图中的身份、位置和构图，再描述动作如何向后发展。",
          example: "The woman shown in <Picture 1> preserves her appearance and position, then slowly raises her gaze.",
        },
        {
          label: "FL2VA",
          text: "<Picture 1> 是开头，<Picture 2> 是结尾。正文重点写两张图之间可连续生成的动作、姿势和构图变化，最后准确落到 Picture 2。",
          example: "The subject begins from <Picture 1> and gradually settles into the pose and composition established by <Picture 2> at the end.",
        },
        {
          label: "不要这样",
          text: "不要连续堆写 <Subject 1> <Picture 1> <Video 1>；不要每个动作都重复 Subject；不要在每个 Shot 里反复引用只提供人物外观的 Picture；不要用 Video 代指视频里的人。",
        },
      ],
    },
  };

  Object.assign(HELP_CONTENT, {
    "task-reference generation": { title: "reference generation", purpose: "参考资产提供人物、场景、风格、动作、摄影机或分镜指导，但不直接成为具体关键帧，也不是被编辑或续写的源视频。", usage: "图片只提供角色外观、视频只提供镜头运动或音频只提供生成指导时使用。", output: "写入 Summary 开头的任务类型组合。", caution: "参考视频存在不代表必须选择 video editing。" },
    "task-keyframe completion": { title: "keyframe completion", purpose: "参考图片作为目标视频的首帧、关键帧、尾帧或其他具体画面锚点。", usage: "只要要求某个时刻对应某张图，就应选择。", output: "写入 Summary 的任务类型组合。", caution: "图片仅用于人物外观参考时通常不选。" },
    "task-video editing": { title: "video editing", purpose: "对既有源视频本身进行直接修改。", usage: "例如替换主体、局部重绘、改变源视频内容但保留其时间结构。", output: "Summary 通常应说明目标是 <Video 1> 的编辑版本。", caution: "图片编辑或两张静帧之间生成不属于 video editing。" },
    "task-video continuation": { title: "video continuation", purpose: "从一个既有参考视频的结尾继续、延长或衔接生成新内容。", usage: "目标内容必须明确从源视频末态向后发展。", output: "写入 Summary 的任务类型组合，并在 Shot 中自然引用源 Video。", caution: "只参考镜头节奏但不从结尾继续时不要选择。" },
    "task-audio reuse": { title: "audio reuse", purpose: "目标视频直接复用全部或部分原始音频信号。", usage: "保留源视频原声、复制独立配乐或复用一段对白信号时选择。", output: "写入 Summary；Audio 的 retention 关系应使用 fully_copy 或 partially_copy。", caution: "只模仿音色、节奏或音乐风格不属于复用。" },
    "task-audio reference": { title: "audio reference", purpose: "不复制原始信号，只参考音色、说话方式、节拍、音乐风格或声音质感。", usage: "例如让新台词采用参考音色，或让新配乐延续参考风格。", output: "写入 Summary；Audio retention 通常使用 reference 或 weak_reference。", caution: "不要把原音频内容误写成直接复制。" },
    "style-live-action": { title: "live-action｜真人实拍", purpose: "指定接近真实摄影、真实材质和自然人体表现的视觉媒介。", usage: "常与 cinematic 混合；关键帧模式应优先服从参考图本身的媒介。", output: "作为 Shot 1 的整体风格开场。", caution: "它只定义媒介，不自动意味着纪录片光线或手持镜头。" },
    "style-cinematic": { title: "cinematic｜电影感", purpose: "强调电影式构图、灯光、镜头语言和整体影像完成度。", usage: "可以和真人、二维、三维或水彩等媒介组合。", output: "与其他已选风格词合并到整体风格描述。", caution: "仍需在 Shot 中具体写构图和摄影机运动，单独勾选不会替代镜头描述。" },
    "style-2D-animated": { title: "2D-animated｜二维动画", purpose: "指定平面绘制、赛璐珞或插画式动画媒介。", usage: "可配合 cinematic、watercolor 或自定义线条与上色风格。", output: "作为目标视频整体视觉风格。", caution: "不要与 live-action 同时选择，除非确实需要混合媒介。" },
    "style-3D CG": { title: "3D CG｜三维CG", purpose: "指定三维建模、材质、灯光和渲染构成的视觉媒介。", usage: "可搭配 cinematic，并在自定义风格中补充写实或卡通渲染。", output: "作为目标视频整体视觉风格。", caution: "它不自动规定写实程度，需要额外描述材质与渲染倾向。" },
    "style-claymation": { title: "claymation｜黏土动画", purpose: "指定具有手工黏土材质和逐格动画质感的媒介。", usage: "适合强调可见指纹、软质表面和轻微逐格运动。", output: "作为目标视频整体视觉风格。", caution: "人物比例和动作节奏仍需在 Shot 中描述。" },
    "style-watercolor": { title: "watercolor｜水彩", purpose: "指定水彩颜料晕染、纸张纹理与柔和色彩边缘。", usage: "可与 2D-animated 或 vintage film 组合。", output: "作为目标视频整体视觉风格。", caution: "关键人物身份仍需通过稳定轮廓、服装和五官特征维持。" },
    "style-vintage film": { title: "vintage film｜复古胶片", purpose: "指定旧式胶片的颗粒、色偏、动态范围和曝光质感。", usage: "可与 live-action、cinematic 或 watercolor 组合。", output: "作为目标视频整体视觉风格。", caution: "它描述影像质感，不等于剧情年代；年代信息应另写场景和服装。" },
  });

  const $ = (selector) => document.querySelector(selector);
  const editorRoot = $("#editor-root");
  const sectionNavHost = $("#section-nav-host");
  const taskPresetToolbar = $("#task-preset-toolbar");
  const promptOutput = $("#prompt-output");
  const validationRoot = $("#validation");
  const helpPopover = $("#help-popover");
  const helpTitle = $("#help-title");
  const helpBody = $("#help-body");
  const toast = $("#toast");
  let toastTimer;
  let helpAnchor = null;
  let helpPinned = false;
  let helpHideTimer;
  let currentValidationResult = { errors: [], warnings: [] };

  function uid() {
    return (globalThis.crypto && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function createReference(type, overrides = {}) {
    return {
      id: uid(),
      type,
      definition: "",
      context: "",
      relation: type === "Audio" ? "reference" : "fully_preserved",
      retention: "",
      expanded: false,
      ...overrides,
    };
  }

  function createSubject(overrides = {}) {
    return {
      id: uid(),
      definition: "",
      appears: "1",
      relation: "fully_preserved",
      retention: "",
      ...overrides,
    };
  }

  function presetDuration(duration) {
    const value = Number(duration);
    return Number.isFinite(value) && value > 0 ? String(duration) : "8.00";
  }

  function presetStart(duration, ratio) {
    const total = Number(presetDuration(duration));
    return Math.max(0.001, total * ratio).toFixed(3);
  }

  function basePreset(duration, overrides = {}) {
    return {
      duration: presetDuration(duration),
      styles: ["live-action", "cinematic"],
      customStyle: "",
      shots: [{ id: uid(), start: "", content: "" }],
      soundscape: "Natural environmental room tone and subtle physical movement sounds.",
      noMusic: true,
      music: "",
      ...overrides,
    };
  }

  function generalRefPreset(duration = "8.00") {
    return basePreset(duration, {
      references: [createReference("Picture")],
      subjects: [createSubject({
        definition: "is the primary character in <Picture 1>, preserving the character's identity, defining facial features, hairstyle, body proportions, clothing, accessories, and colors.",
        retention: "the identity, defining facial features, hairstyle, body proportions, clothing, accessories, and colors established by <Picture 1> remain consistent.",
      })],
      taskTypes: ["reference generation"],
      summaries: [{ id: uid(), content: "The target video is a concise reference-driven shot centered on <Subject 1>." }],
      shots: [{
        id: uid(),
        start: "",
        content: "A close shot frames <Subject 1> in an environment consistent with <Picture 1>. The character briefly looks off-camera, pauses, and returns their gaze toward the lens while the camera pushes in with small amplitude at slow speed.",
      }],
    });
  }

  function twoCharacterScenePreset(duration = "8.00") {
    return basePreset(duration, {
      references: [createReference("Picture"), createReference("Picture"), createReference("Picture")],
      subjects: [
        createSubject({
          definition: "is the first character in <Picture 1>, preserving the character's identity, face, hairstyle, body proportions, clothing, accessories, and colors.",
          appears: "1, 2",
          retention: "the identity, face, hairstyle, body proportions, clothing, accessories, and colors established by <Picture 1> remain consistent.",
        }),
        createSubject({
          definition: "is the second character in <Picture 2>, preserving the character's identity, face, hairstyle, body proportions, clothing, accessories, and colors.",
          appears: "1, 2",
          retention: "the identity, face, hairstyle, body proportions, clothing, accessories, and colors established by <Picture 2> remain consistent.",
        }),
        createSubject({
          definition: "is the environment in <Picture 3>, preserving its spatial layout, lighting direction, background objects, materials, and color palette.",
          appears: "1, 2",
          retention: "the spatial layout, lighting direction, background objects, materials, and color palette established by <Picture 3> remain consistent.",
        }),
      ],
      taskTypes: ["reference generation"],
      summaries: [{ id: uid(), content: "<Subject 1> and <Subject 2> share a tense encounter inside <Subject 3>." }],
      shots: [
        { id: uid(), start: "", content: "A side close shot frames <Subject 1> and <Subject 2> facing each other inside <Subject 3>. <Subject 1> takes a small step closer while <Subject 2> remains still and watches." },
        { id: uid(), start: presetStart(duration, 0.55), content: "the camera cuts to a close reaction shot of <Subject 2>. The character's eyes shift briefly toward <Subject 1>, followed by a restrained inhale." },
      ],
      soundscape: "Quiet environmental room tone, soft footsteps, clothing movement, and restrained breathing.",
    });
  }

  function characterProductPreset(duration = "8.00") {
    return basePreset(duration, {
      references: [createReference("Picture"), createReference("Picture"), createReference("Picture")],
      subjects: [
        createSubject({
          definition: "is the presenter in <Picture 1>, preserving the character's identity, face, hairstyle, body proportions, clothing, accessories, and colors.",
          appears: "1, 2",
          retention: "the identity, face, hairstyle, body proportions, clothing, accessories, and colors established by <Picture 1> remain consistent.",
        }),
        createSubject({
          definition: "is the product in <Picture 2>, preserving its exact shape, proportions, materials, surface finish, branding placement, and colors.",
          appears: "1, 2",
          retention: "the exact shape, proportions, materials, surface finish, branding placement, and colors established by <Picture 2> remain consistent.",
        }),
        createSubject({
          definition: "is the studio environment in <Picture 3>, preserving its spatial layout, background, lighting direction, surfaces, and color palette.",
          appears: "1, 2",
          retention: "the spatial layout, background, lighting direction, surfaces, and color palette established by <Picture 3> remain consistent.",
        }),
      ],
      taskTypes: ["reference generation"],
      summaries: [{ id: uid(), content: "<Subject 1> presents <Subject 2> inside <Subject 3> in a concise product demonstration." }],
      shots: [
        { id: uid(), start: "", content: "A close shot frames <Subject 1> beside <Subject 2> inside <Subject 3>. The presenter reaches toward the product and lifts it smoothly into the key light." },
        { id: uid(), start: presetStart(duration, 0.58), content: "the camera cuts to an extreme close-up of <Subject 2> in <Subject 1>'s hands, revealing its material, surface finish, controls, and branding placement." },
      ],
      soundscape: "Clean studio room tone, subtle hand movement, and precise product handling sounds.",
    });
  }

  function generalT2VAPreset(duration = "8.00") {
    return basePreset(duration, {
      shots: [{ id: uid(), start: "", content: "A close shot frames a person standing beside a window in a quiet room. The person turns toward the incoming daylight as the camera pushes in with small amplitude at slow speed." }],
      soundscape: "Quiet indoor room tone, faint exterior ambience, soft clothing movement, and natural breathing.",
    });
  }

  function suspenseT2VAPreset(duration = "8.00") {
    return basePreset(duration, {
      shots: [
        { id: uid(), start: "", content: "A close shot frames a person abruptly stopping beside a half-open door. Their eyes fix on something unseen beyond the doorway while the camera pushes in with small amplitude at slow speed." },
        { id: uid(), start: presetStart(duration, 0.38), content: "the camera cuts to an extreme close-up of a hand tightening around the door handle as the handle begins to turn from the other side." },
        { id: uid(), start: presetStart(duration, 0.74), content: "the camera cuts back to the person's face. A shadow crosses behind them, but they are still looking through the doorway." },
      ],
      soundscape: "Low interior room tone, a faint hinge creak, metal handle movement, restrained breathing, and one soft footstep from behind.",
    });
  }

  function dialogueT2VAPreset(duration = "8.00") {
    return basePreset(duration, {
      shots: [
        { id: uid(), start: "", content: "A close two-shot frames two adults seated across a small table. The first adult with a restrained voice (S1) holds eye contact with the silent second adult and says, <d>[Chinese] 你迟到了。</d> The second adult does not answer." },
        { id: uid(), start: presetStart(duration, 0.55), content: "the camera cuts to a close reaction shot of the second adult with a quiet, firm voice (S2), who glances at the empty chair beside (S1) and says, <d>[Chinese] 我不是来见你的。</d>" },
      ],
      soundscape: "Quiet indoor room tone, subtle clothing movement, natural breathing, and clearly recorded synchronized dialogue.",
    });
  }

  function productT2VAPreset(duration = "8.00") {
    return basePreset(duration, {
      customStyle: "clean commercial lighting, controlled reflections",
      shots: [
        { id: uid(), start: "", content: "A polished product rests on a matte pedestal in a dark studio. A narrow key light travels across its silhouette while the camera trucks right with small amplitude at slow speed." },
        { id: uid(), start: presetStart(duration, 0.46), content: "the camera cuts to a close shot of a hand using the product once, clearly revealing its primary function and tactile response." },
        { id: uid(), start: presetStart(duration, 0.75), content: "the camera cuts to an extreme macro view of the product's material, edge detail, and precise surface finish before settling on a clean hero composition." },
      ],
      soundscape: "Clean studio room tone, subtle mechanical interaction, fingertip contact, and precise material sounds.",
    });
  }

  function generalI2VAPreset(duration = "8.00") {
    return basePreset(duration, {
      shots: [{ id: uid(), start: "", content: "The subject shown in <Picture 1> preserves the exact identity, appearance, clothing, pose, composition, lighting, and surrounding scene. The subject slowly turns their gaze toward the camera while the camera pushes in with small amplitude at slow speed." }],
      soundscape: "Natural environmental room tone, soft clothing movement, and restrained breathing.",
    });
  }

  function microMotionI2VAPreset(duration = "8.00") {
    return basePreset(duration, {
      shots: [{ id: uid(), start: "", content: "The character shown in <Picture 1> preserves the exact identity, facial features, hairstyle, clothing, pose, framing, lighting, and background. Only subtle natural motion develops: a soft blink, gentle breathing, a slight shift of the eyes, and minimal hair movement while the camera pushes in with small amplitude at slow speed." }],
      soundscape: "Quiet room tone, soft breathing, and barely audible clothing movement.",
    });
  }

  function reactionI2VAPreset(duration = "8.00") {
    return basePreset(duration, {
      shots: [{ id: uid(), start: "", content: "The character shown in <Picture 1> preserves the exact identity, facial features, hairstyle, clothing, position, composition, lighting, and environment. A faint sound draws the character's attention; they pause, shift their eyes toward the source, and slowly turn their head while the camera holds the original direction." }],
      soundscape: "Natural environmental room tone, one faint off-screen sound, restrained breathing, and soft clothing movement.",
    });
  }

  function generalFL2VAPreset(duration = "8.00") {
    return basePreset(duration, {
      lastShot: "1",
      shots: [{ id: uid(), start: "", content: "The subject begins in the exact state, pose, spacing, lighting, and composition established by <Picture 1>. A single continuous action connects the two states without cuts, and the subject settles precisely into the state, pose, spacing, lighting, and composition established by <Picture 2> at the end of the shot." }],
      soundscape: "Natural environmental room tone and synchronized physical movement sounds.",
    });
  }

  function emotionFL2VAPreset(duration = "8.00") {
    return basePreset(duration, {
      lastShot: "1",
      shots: [{ id: uid(), start: "", content: "The character begins with the exact identity, expression, pose, framing, lighting, and environment established by <Picture 1>. The camera direction remains stable as the character's gaze, facial muscles, breathing, and posture change gradually and naturally, ending in the exact expression, pose, spacing, lighting, and composition established by <Picture 2>." }],
      soundscape: "Quiet environmental room tone, changing breath, and subtle clothing movement.",
    });
  }

  function transformationFL2VAPreset(duration = "8.00") {
    return basePreset(duration, {
      customStyle: "continuous visible transformation, stable geometry",
      lastShot: "1",
      shots: [{ id: uid(), start: "", content: "The frame begins exactly from <Picture 1>. The visible materials, colors, silhouette, lighting, and surrounding details transform progressively through continuous intermediate states, with no cuts, flashes, or scene reset. The transformation slows and resolves into the exact geometry, spacing, lighting, and composition established by <Picture 2> at the final moment." }],
      soundscape: "Continuous material movement, subtle environmental resonance, and synchronized transformation sounds.",
    });
  }

  function videoCharacterReplacementPreset(duration = "8.00") {
    return {
      duration: String(duration || "8.00"),
      styles: ["live-action", "cinematic"],
      customStyle: "",
      references: [
        createReference("Picture"),
        createReference("Video", {
          definition: "is the source video for the target video edit, providing the original duration, shot structure, framing, camera movement, action timing, environment, lighting, and the performance of the original character.",
          context: "source video structure used throughout [Shot 1]",
          relation: "partially_preserved",
          retention: "the original duration, framing, camera movement, cuts, action timing, poses, environment, lighting, and object interactions are preserved, while the original character's identity and visible appearance are replaced.",
          expanded: true,
        }),
      ],
      subjects: [
        {
          id: uid(),
          definition: "is the replacement character whose identity, defining features, silhouette, colors, clothing, and accessories come from <Picture 1>. The character replaces the original character in <Video 1>.",
          appears: "1",
          relation: "fully_preserved",
          retention: "the identity, defining features, silhouette, colors, clothing, and accessories established by <Picture 1> remain consistent throughout the video.",
        },
      ],
      taskTypes: ["video editing", "reference generation"],
      summaries: [
        { id: uid(), content: "The target video is an edited version of <Video 1>." },
        { id: uid(), content: "The original character is replaced throughout the video by <Subject 1>. The source video's actions, poses, spatial positions, expressions, camera movement, cuts, timing, environment, and lighting are preserved, while the original character's identity and visible appearance are replaced." },
      ],
      shots: [
        {
          id: uid(),
          start: "",
          content: "The target video is a direct edit of <Video 1> from its first frame through its final frame. <Subject 1> replaces the original character throughout the entire video. The replacement character's identity, defining features, silhouette, colors, clothing, and accessories remain consistent with <Picture 1>, while the character precisely follows the original performance's body position, pose, motion trajectory, action timing, gaze direction, expression timing, and interactions with the environment. Preserve the original video's duration, framing, camera angle, camera movement, cuts, pacing, background, lighting, shadows, props, and all other visible elements without introducing new actions or camera movements.",
        },
      ],
      soundscape: "N/A",
      noMusic: true,
      music: "",
    };
  }

  function blankMode(mode) {
    const base = {
      duration: "8.00",
      styles: [],
      customStyle: "",
      shots: [{ id: uid(), start: "", content: "" }],
      soundscape: "",
      noMusic: true,
      music: "",
    };
    if (mode === "ref") {
      return {
        ...base,
        references: [],
        subjects: [],
        taskTypes: ["reference generation"],
        summaries: [],
      };
    }
    if (mode === "fl2va") return { ...base, lastShot: "1" };
    return base;
  }

  function sampleMode(mode) {
    if (mode === "ref") {
      return {
        duration: "8.00",
        styles: ["live-action", "cinematic"],
        customStyle: "",
        references: [
          { id: uid(), type: "Picture" },
          { id: uid(), type: "Picture" },
        ],
        subjects: [
          {
            id: uid(),
            definition: "is the adult woman in <Picture 1>, retaining her facial identity, long black hair, gray coat, and black trousers.",
            appears: "1, 2",
            relation: "fully_preserved",
            retention: "her face, hairstyle, gray coat, and black trousers remain consistent.",
          },
          {
            id: uid(),
            definition: "is the nighttime café in <Picture 2>, retaining its rain-covered window, wooden table, and warm pendant light.",
            appears: "1, 2",
            relation: "fully_preserved",
            retention: "the window, table, pendant light, and rainy nighttime atmosphere remain consistent.",
          },
        ],
        taskTypes: ["reference generation"],
        summaries: [
          { id: uid(), content: "The target is an eight-second suspense video." },
          { id: uid(), content: "<Subject 1> discovers a sealed envelope inside <Subject 2>." },
        ],
        shots: [
          {
            id: uid(),
            start: "",
            content: "A close-up frames <Subject 1> seated beside the rain-covered window in <Subject 2>. She notices a sealed envelope on the table and slowly reaches toward it.",
          },
          {
            id: uid(),
            start: "4.000",
            content: "the camera cuts to an extreme close-up of her fingers opening the envelope. She removes a photograph and becomes completely still.",
          },
        ],
        soundscape: "Quiet café room tone, rain against the window, soft paper movement, and restrained breathing.",
        noMusic: true,
        music: "",
      };
    }
    if (mode === "t2va") {
      return {
        duration: "8.00",
        styles: ["live-action", "cinematic"],
        customStyle: "",
        shots: [
          {
            id: uid(), start: "",
            content: "A close shot frames a baker opening a small street bakery before sunrise. The camera pushes in with small amplitude at slow speed as she places a fresh loaf on the counter.",
          },
          {
            id: uid(), start: "5.000",
            content: "the camera cuts to an extreme close-up of steam rising from the sliced bread.",
          },
        ],
        soundscape: "Wooden shutters scrape open, trays clink softly, and bread is sliced on the counter.",
        noMusic: true,
        music: "",
      };
    }
    if (mode === "i2va") {
      return {
        duration: "8.00",
        styles: ["live-action", "cinematic"],
        customStyle: "",
        shots: [
          {
            id: uid(), start: "",
            content: "The woman shown in <Picture 1> preserves her appearance, clothing, position, and surrounding scene. She slowly raises her gaze while the camera pushes in with small amplitude at slow speed.",
          },
        ],
        soundscape: "Quiet indoor room tone, soft clothing movement, and restrained breathing.",
        noMusic: true,
        music: "",
      };
    }
    return {
      duration: "8.00",
      styles: ["live-action", "cinematic"],
      customStyle: "",
      lastShot: "1",
      shots: [
        {
          id: uid(), start: "",
          content: "The subject begins in the pose and composition established by <Picture 1>. The camera holds a static shot as the subject moves continuously and settles into the exact pose, spacing, lighting, and composition established by <Picture 2> at the end of the shot.",
        },
      ],
      soundscape: "Soft clothing movement, quiet footsteps, and low environmental room tone.",
      noMusic: true,
      music: "",
    };
  }

  function defaultStore() {
    return {
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
      activeMode: "ref",
      focusMode: true,
      customPresets: [],
      modes: {
        ref: sampleMode("ref"),
        t2va: sampleMode("t2va"),
        i2va: sampleMode("i2va"),
        fl2va: sampleMode("fl2va"),
      },
    };
  }

  function normalizeModeState(mode, candidate) {
    const fallback = sampleMode(mode);
    const source = candidate && typeof candidate === "object" ? candidate : {};
    const state = { ...fallback, ...source };
    state.duration = String(source.duration ?? fallback.duration);
    state.styles = Array.isArray(source.styles) ? source.styles.filter((item) => typeof item === "string") : fallback.styles;
    state.customStyle = typeof source.customStyle === "string" ? source.customStyle : "";
    state.soundscape = typeof source.soundscape === "string" ? source.soundscape : fallback.soundscape;
    state.noMusic = typeof source.noMusic === "boolean" ? source.noMusic : true;
    state.music = typeof source.music === "string" ? source.music : "";
    state.shots = Array.isArray(source.shots) && source.shots.length
      ? source.shots.map((shot) => ({
          id: typeof shot?.id === "string" ? shot.id : uid(),
          start: typeof shot?.start === "string" ? shot.start : "",
          content: typeof shot?.content === "string" ? shot.content : "",
        }))
      : fallback.shots;
    if (mode === "ref") {
      state.references = Array.isArray(source.references) ? source.references.map((ref) => {
        const type = ["Picture", "Video", "Audio"].includes(ref?.type) ? ref.type : "Picture";
        return createReference(type, { ...ref, type, id: typeof ref?.id === "string" ? ref.id : uid() });
      }) : fallback.references.map((ref) => createReference(ref.type, ref));
      state.subjects = Array.isArray(source.subjects) ? source.subjects.map((subject) => createSubject({
        ...subject,
        id: typeof subject?.id === "string" ? subject.id : uid(),
        definition: typeof subject?.definition === "string" ? subject.definition : "",
        appears: typeof subject?.appears === "string" ? subject.appears : "1",
        relation: VISUAL_RELATIONS.includes(subject?.relation) ? subject.relation : "fully_preserved",
        retention: typeof subject?.retention === "string" ? subject.retention : "",
      })) : fallback.subjects;
      state.taskTypes = Array.isArray(source.taskTypes) ? source.taskTypes.filter((item) => TASK_TYPES.includes(item)) : fallback.taskTypes;
      state.summaries = Array.isArray(source.summaries) ? source.summaries.map((summary) => ({
        id: typeof summary?.id === "string" ? summary.id : uid(),
        content: typeof summary?.content === "string" ? summary.content : "",
      })) : fallback.summaries;
    }
    if (mode === "fl2va") state.lastShot = String(source.lastShot || state.shots.length || 1);
    return state;
  }

  function normalizeStore(candidate, strict = false) {
    if (strict && (!candidate || typeof candidate !== "object" || !candidate.modes)) {
      throw new Error("文件中没有有效的工作区数据");
    }
    const source = candidate && typeof candidate === "object" ? candidate : {};
    const normalized = {
      schemaVersion: SCHEMA_VERSION,
      appVersion: APP_VERSION,
      activeMode: MODE_META[source.activeMode] ? source.activeMode : "ref",
      focusMode: typeof source.focusMode === "boolean" ? source.focusMode : true,
      customPresets: [],
      modes: {},
    };
    Object.keys(MODE_META).forEach((mode) => {
      normalized.modes[mode] = normalizeModeState(mode, source.modes?.[mode]);
    });
    if (Array.isArray(source.customPresets)) {
      normalized.customPresets = source.customPresets
        .filter((preset) => preset && typeof preset.title === "string" && MODE_META[preset.mode] && preset.state)
        .map((preset) => ({
          id: typeof preset.id === "string" ? preset.id : `custom-${uid()}`,
          mode: preset.mode,
          title: preset.title.slice(0, 40),
          state: normalizeModeState(preset.mode, preset.state),
          updatedAt: typeof preset.updatedAt === "string" ? preset.updatedAt : new Date().toISOString(),
        }));
    }
    return normalized;
  }

  function loadStore() {
    try {
      const current = localStorage.getItem(STORAGE_KEY);
      const legacy = current ? null : localStorage.getItem(LEGACY_STORAGE_KEY);
      const raw = current || legacy;
      if (!raw) return defaultStore();
      const normalized = normalizeStore(JSON.parse(raw));
      if (legacy) localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    } catch {
      return defaultStore();
    }
  }

  let store = loadStore();
  const HISTORY_LIMIT = 80;
  const historyState = {
    undo: [],
    redo: [],
    lastGroup: "",
    lastRecordedAt: 0,
    restoring: false,
  };

  function storeSnapshot() {
    return JSON.stringify(store);
  }

  function updateHistoryControls() {
    const undoButton = $("#undo-action");
    const redoButton = $("#redo-action");
    if (undoButton) undoButton.disabled = historyState.undo.length === 0;
    if (redoButton) redoButton.disabled = historyState.redo.length === 0;
  }

  function recordHistory(group = "edit", coalesce = false) {
    if (historyState.restoring) return;
    const snapshot = storeSnapshot();
    const now = Date.now();
    const continuesGroup = coalesce
      && historyState.lastGroup === group
      && now - historyState.lastRecordedAt < 1200;
    if (!continuesGroup && historyState.undo.at(-1) !== snapshot) {
      historyState.undo.push(snapshot);
      if (historyState.undo.length > HISTORY_LIMIT) historyState.undo.shift();
    }
    historyState.redo = [];
    historyState.lastGroup = coalesce ? group : "";
    historyState.lastRecordedAt = now;
    updateHistoryControls();
  }

  function restoreHistorySnapshot(snapshot) {
    historyState.restoring = true;
    try {
      store = normalizeStore(JSON.parse(snapshot), true);
      saveStore();
      renderEditor(true);
    } finally {
      historyState.restoring = false;
      historyState.lastGroup = "";
      historyState.lastRecordedAt = 0;
      updateHistoryControls();
    }
  }

  function undoEdit() {
    const snapshot = historyState.undo.pop();
    if (!snapshot) return;
    historyState.redo.push(storeSnapshot());
    restoreHistorySnapshot(snapshot);
    showToast("已撤回上一步");
  }

  function redoEdit() {
    const snapshot = historyState.redo.pop();
    if (!snapshot) return;
    historyState.undo.push(storeSnapshot());
    restoreHistorySnapshot(snapshot);
    showToast("已重做上一步");
  }

  function cloneModeState(modeState) {
    const cloned = JSON.parse(JSON.stringify(modeState));
    ["references", "subjects", "summaries", "shots"].forEach((collection) => {
      if (!Array.isArray(cloned[collection])) return;
      cloned[collection].forEach((item) => { item.id = uid(); });
    });
    return cloned;
  }

  function saveStore() {
    const indicator = $("#save-state");
    try {
      store.schemaVersion = SCHEMA_VERSION;
      store.appVersion = APP_VERSION;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
      indicator.innerHTML = "<i></i> 已自动保存";
      indicator.classList.remove("failed");
      return true;
    } catch {
      indicator.innerHTML = "<i></i> 自动保存失败";
      indicator.classList.add("failed");
      return false;
    }
  }

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function option(value, current, label = value) {
    return `<option value="${esc(value)}" ${value === current ? "selected" : ""}>${esc(label)}</option>`;
  }

  function helpTriggerMarkup(key, extraClass = "") {
    return `<button class="help-trigger ${extraClass}" type="button" data-help-key="${esc(key)}" aria-label="查看参数说明" aria-expanded="false">i</button>`;
  }

  function createHelpTrigger(key, extraClass = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `help-trigger ${extraClass}`.trim();
    button.dataset.helpKey = key;
    button.setAttribute("aria-label", "查看参数说明");
    button.setAttribute("aria-expanded", "false");
    button.textContent = "i";
    return button;
  }

  function appendHelpTrigger(container, key, extraClass = "") {
    if (!container || !HELP_CONTENT[key] || container.querySelector(`:scope > .help-trigger[data-help-key="${CSS.escape(key)}"]`)) return;
    container.appendChild(createHelpTrigger(key, extraClass));
  }

  function decorateParameterHelp() {
    const fieldBindings = [
      ['input[data-global="duration"]', "duration"],
      ['select[data-global="lastShot"]', "lastShot"],
      ['input[data-global="customStyle"]', "customStyle"],
      ['textarea[data-entity="references"][data-key="definition"]', "referenceDefinition"],
      ['input[data-entity="references"][data-key="context"]', "referenceContext"],
      ['select[data-entity="references"][data-key="relation"]', "referenceRelation"],
      ['textarea[data-entity="references"][data-key="retention"]', "referenceRetention"],
      ['textarea[data-entity="subjects"][data-key="definition"]', "subjectDefinition"],
      ['input[data-entity="subjects"][data-key="appears"]', "subjectAppears"],
      ['select[data-entity="subjects"][data-key="relation"]', "subjectRelation"],
      ['textarea[data-entity="subjects"][data-key="retention"]', "subjectRetention"],
      ['textarea[data-entity="summaries"][data-key="content"]', "summaryContent"],
      ['[data-help-field="shotStartFixed"]', "shotStartFixed"],
      ['input[data-entity="shots"][data-key="start"]', "shotStart"],
      ['[data-help-field="shotPrefix"]', "shotPrefix"],
      ['textarea[data-entity="shots"][data-key="content"]', "shotContent"],
      ['textarea[data-global="soundscape"]', "soundscape"],
      ['textarea[data-global="music"]', "music"],
    ];
    fieldBindings.forEach(([selector, key]) => {
      editorRoot.querySelectorAll(selector).forEach((control) => appendHelpTrigger(control.closest(".field"), key, "field-help"));
    });

    editorRoot.querySelectorAll("[data-task-type]").forEach((input) => {
      appendHelpTrigger(input.closest(".check-option"), `task-${input.dataset.taskType}`, "option-help");
    });
    editorRoot.querySelectorAll("[data-style-preset]").forEach((input) => {
      appendHelpTrigger(input.closest(".style-option"), `style-${input.dataset.stylePreset}`, "option-help");
    });
    const noMusic = editorRoot.querySelector('[data-global="noMusic"]');
    if (noMusic) appendHelpTrigger(noMusic.closest(".switch-row"), "noMusic", "switch-help");
  }

  function renderHelpBody(info) {
    const rows = info.sections || [
      { label: "作用", text: info.purpose },
      { label: "怎么填", text: info.usage },
      { label: "影响输出", text: info.output },
      { label: "注意", text: info.caution },
    ];
    return rows.map(({ label, text, example }) => `<section>
      <strong>${esc(label)}</strong>
      <div class="help-copy"><p>${esc(text)}</p>${example ? `<code>${esc(example)}</code>` : ""}</div>
    </section>`).join("");
  }

  function positionHelpPopover(anchor) {
    if (!anchor?.isConnected || helpPopover.hidden) return;
    const anchorRect = anchor.getBoundingClientRect();
    const popoverRect = helpPopover.getBoundingClientRect();
    const gap = 10;
    let left = anchorRect.right + gap;
    if (left + popoverRect.width > window.innerWidth - 12) left = anchorRect.left - popoverRect.width - gap;
    left = Math.max(12, Math.min(left, window.innerWidth - popoverRect.width - 12));
    let top = anchorRect.top - 10;
    if (top + popoverRect.height > window.innerHeight - 12) top = window.innerHeight - popoverRect.height - 12;
    top = Math.max(12, top);
    helpPopover.style.left = `${Math.round(left)}px`;
    helpPopover.style.top = `${Math.round(top)}px`;
  }

  function showHelp(key, anchor, pinned = false) {
    const info = HELP_CONTENT[key];
    if (!info || !anchor) return;
    clearTimeout(helpHideTimer);
    helpAnchor?.setAttribute("aria-expanded", "false");
    helpAnchor = anchor;
    helpPinned = pinned;
    helpTitle.textContent = info.title;
    helpBody.innerHTML = renderHelpBody(info);
    helpPopover.hidden = false;
    helpPopover.classList.toggle("pinned", pinned);
    anchor.setAttribute("aria-expanded", "true");
    positionHelpPopover(anchor);
  }

  function closeHelp() {
    clearTimeout(helpHideTimer);
    helpAnchor?.setAttribute("aria-expanded", "false");
    helpAnchor = null;
    helpPinned = false;
    helpPopover.hidden = true;
    helpPopover.classList.remove("pinned");
  }

  function scheduleHelpClose() {
    if (helpPinned) return;
    clearTimeout(helpHideTimer);
    helpHideTimer = setTimeout(closeHelp, 140);
  }

  function section(title, count, actions, help, body, anchor) {
    return `
      <section class="form-section" id="section-${esc(anchor)}">
        <div class="section-header">
          <div class="section-title">${esc(title)}${count !== null ? `<span class="section-count">${count}</span>` : ""}</div>
          <div class="add-row">${actions || ""}</div>
        </div>
        <div class="section-body">
          ${help ? `<p class="section-help">${help}</p>` : ""}
          ${body}
        </div>
      </section>`;
  }

  function renderSectionNav(mode, focusMode) {
    const items = focusMode
      ? [
          ["duration", "时长"],
          ["shots", "分镜"],
          ["audio", "声音"],
        ]
      : mode === "ref"
      ? [
          ["duration", "时长"],
          ["style", "风格"],
          ["references", "素材"],
          ["subjects", "主体"],
          ["summary", "概述"],
          ["shots", "分镜"],
          ["audio", "声音"],
        ]
      : [
          ["duration", "时间"],
          ["style", "风格"],
          ["shots", "分镜"],
          ["audio", "声音"],
        ];
    return `<nav class="section-nav" aria-label="编辑步骤">
      <span class="nav-heading">流程</span>
      ${items.map(([anchor, label], index) => `
        <button data-action="jump-section" data-target="section-${anchor}" title="${esc(label)}">
          <span class="nav-index">${String(index + 1).padStart(2, "0")}</span>
          <span class="nav-label">${esc(label)}</span>
        </button>`).join("")}
    </nav>`;
  }

  function entityButtons(kind, id, index, total) {
    return `<div class="inline-actions">
      <button class="mini-button" data-action="move" data-kind="${kind}" data-id="${id}" data-dir="-1" ${index === 0 ? "disabled" : ""}>↑</button>
      <button class="mini-button" data-action="move" data-kind="${kind}" data-id="${id}" data-dir="1" ${index === total - 1 ? "disabled" : ""}>↓</button>
      <button class="mini-button delete" data-action="delete" data-kind="${kind}" data-id="${id}">删除</button>
    </div>`;
  }

  function refLabels(modeState) {
    const counts = { Picture: 0, Video: 0, Audio: 0 };
    return (modeState.references || []).map((ref) => {
      counts[ref.type] += 1;
      return { ...ref, label: `<${ref.type} ${counts[ref.type]}>` };
    });
  }

  function availableTokens(modeState, mode) {
    if (mode === "ref") {
      const subjects = modeState.subjects.map((_, index) => `<Subject ${index + 1}>`);
      return [...subjects, ...refLabels(modeState).map((item) => item.label)];
    }
    if (mode === "i2va") return ["<Picture 1>"];
    if (mode === "fl2va") return ["<Picture 1>", "<Picture 2>"];
    return [];
  }

  function tokenKind(token) {
    const match = token.match(/^<(Subject|Picture|Video|Audio)/);
    return match ? match[1].toLowerCase() : "default";
  }

  function renderTokenTools(tokens, entity, id, key) {
    if (!tokens.length) {
      return `<div class="token-tools empty"><span>当前模式没有外部引用标签，直接描述画面即可。</span></div>`;
    }
    return `<div class="token-tools">
      <span class="token-label">快速插入引用</span>
      <div class="token-list">
        ${tokens.map((token) => `<button
          class="token-button ${tokenKind(token)}"
          data-action="insert-token"
          data-entity="${esc(entity)}"
          data-id="${esc(id)}"
          data-key="${esc(key)}"
          data-token="${esc(token)}"
          title="插入到当前光标位置"
        >${esc(token)}</button>`).join("")}
      </div>
    </div>`;
  }

  function renderReferenceGuide(mode) {
    if (mode === "ref") {
      return `<div class="reference-guide">
        <div class="guide-title"><strong>Shot 里怎么引用？</strong><span>在对应内容出现的位置插入标签，再继续写它的动作或作用。</span>${helpTriggerMarkup("shotReferences", "guide-help")}</div>
        <div class="guide-grid">
          <div class="guide-item subject"><code>&lt;Subject N&gt;</code><span>人物、场景或物体真正出现在画面里</span></div>
          <div class="guide-item picture"><code>&lt;Picture N&gt;</code><span>某张图直接作为首帧、关键帧或构图锚点</span></div>
          <div class="guide-item video"><code>&lt;Video N&gt;</code><span>沿用源视频的镜头运动、剪辑或连续状态</span></div>
          <div class="guide-item audio"><code>&lt;Audio N&gt;</code><span>在声音发生处注明复用或参考的音色、节奏</span></div>
        </div>
        <p class="guide-example"><span>例：</span>A close-up frames &lt;Subject 1&gt; in &lt;Subject 2&gt;. The shot begins from &lt;Picture 1&gt;.</p>
      </div>`;
    }
    if (mode === "i2va") {
      return `<div class="reference-guide compact">
        <div class="guide-title"><strong>图生如何引用？</strong><span>&lt;Picture 1&gt; 是 0 秒首帧。先写保留哪些画面特征，再写动作如何向后发展。</span>${helpTriggerMarkup("shotReferences", "guide-help")}</div>
        <p class="guide-example"><span>例：</span>The woman shown in &lt;Picture 1&gt; preserves her appearance and position, then slowly raises her gaze.</p>
      </div>`;
    }
    if (mode === "fl2va") {
      return `<div class="reference-guide compact">
        <div class="guide-title"><strong>首尾生如何引用？</strong><span>&lt;Picture 1&gt; 是开头，&lt;Picture 2&gt; 是结尾；Shot 中重点写两张图之间连续发生的变化。</span>${helpTriggerMarkup("shotReferences", "guide-help")}</div>
        <p class="guide-example"><span>例：</span>The subject begins from &lt;Picture 1&gt; and gradually settles into the composition established by &lt;Picture 2&gt;.</p>
      </div>`;
    }
    return `<div class="reference-guide compact">
      <div class="guide-title"><strong>文生模式不使用引用标签</strong><span>直接写构图、主体、环境、动作、摄影机和同步声音。</span></div>
    </div>`;
  }

  function renderTaskPresetToolbar(mode) {
    taskPresetToolbar.hidden = false;
    const builtIns = BUILT_IN_PRESETS.filter((preset) => preset.mode === mode);
    const custom = store.customPresets.filter((preset) => preset.mode === mode);
    const groups = ["通用", "特别"].map((group) => {
      const items = builtIns.filter((preset) => preset.group === group);
      return items.length ? `<optgroup label="${group}">${items.map((preset) => `<option value="${esc(preset.id)}" title="${esc(preset.description)}">${esc(preset.title)}</option>`).join("")}</optgroup>` : "";
    }).join("");
    const customGroup = custom.length
      ? `<optgroup label="我的预设">${custom.map((preset) => `<option value="${esc(preset.id)}">${esc(preset.title)}</option>`).join("")}</optgroup>`
      : "";
    taskPresetToolbar.innerHTML = `
      <label class="preset-select-wrap">
        <span>模板</span>
        <select id="task-preset-select" aria-label="选择任务预设">
          <option value="">先选择一个模板</option>
          ${groups}${customGroup}
        </select>
      </label>
      <button class="task-preset-apply" id="task-preset-apply" type="button" disabled>应用</button>
      <button class="task-preset-secondary" id="task-preset-save" type="button" title="将当前模式全部内容保存为自定义预设">保存模板</button>
      <button class="task-preset-secondary danger" id="task-preset-delete" type="button" title="删除选中的自定义预设" disabled>删除</button>
      <span class="preset-description" id="preset-description">模板会自动准备规范字段；应用后仍可自由修改。</span>
      ${helpTriggerMarkup("taskPreset", "toolbar-help")}`;
  }

  function templateButtons(items, attributes) {
    return items.map(([value, label]) => `<button class="definition-template-button" type="button" data-action="${esc(attributes.action)}" ${attributes.entity ? `data-id="${esc(attributes.entity)}"` : ""} data-template="${esc(value)}">${esc(label)}</button>`).join("");
  }

  function renderSubjectTemplateButtons(subjectId) {
    return `<div class="definition-template-row">
      <span>一键填写定义＋保留规则</span>
      <div>${templateButtons([
        ["character-identity", "角色身份"],
        ["character-full", "完整角色"],
        ["scene", "场景"],
        ["object", "物体"],
      ], { action: "apply-subject-template", entity: subjectId })}</div>
      ${helpTriggerMarkup("definitionTemplates", "template-help")}
    </div>`;
  }

  function renderReferenceTemplateButtons(ref) {
    const items = ref.type === "Picture"
      ? [["picture-subject-source", "仅作Subject来源"], ["picture-keyframe", "关键帧"]]
      : ref.type === "Video"
        ? [["video-edit", "编辑源"], ["video-continuation", "续写源"], ["video-camera", "运镜与节奏"]]
        : [["audio-copy", "完整复用"], ["audio-voice", "音色参考"], ["audio-music", "配乐参考"]];
    return `<div class="definition-template-row reference-template-row">
      <span>常用定义</span>
      <div>${templateButtons(items, { action: "apply-reference-template", entity: ref.id })}</div>
      ${helpTriggerMarkup("definitionTemplates", "template-help")}
    </div>`;
  }

  function renderReferences(modeState) {
    const labels = refLabels(modeState);
    const cards = labels.length
      ? `<div class="reference-editor-list">${labels.map((ref) => {
          const relationOptions = ref.type === "Audio" ? AUDIO_RELATIONS : VISUAL_RELATIONS;
          const currentRelation = ref.relation || (ref.type === "Audio" ? "reference" : "fully_preserved");
          return `<article class="reference-editor-card">
            <div class="reference-editor-head">
              <span class="reference-chip">${esc(ref.label)}</span>
              <button class="mini-button delete" data-action="delete-ref" data-id="${ref.id}" title="删除当前参考标签">删除</button>
            </div>
            <details ${ref.expanded ? "open" : ""}>
              <summary>独立定义与保留关系 <span>仅在需要单独追踪该资产时填写</span></summary>
              ${renderReferenceTemplateButtons(ref)}
              <div class="reference-editor-fields field-grid">
                <label class="field full">
                  <span>独立定义（工具自动添加 ${esc(ref.label)}）</span>
                  <textarea data-entity="references" data-id="${ref.id}" data-key="definition" placeholder="is the source video for the target video edit...">${esc(ref.definition || "")}</textarea>
                </label>
                <label class="field">
                  <span>保留关系作用范围</span>
                  <input data-entity="references" data-id="${ref.id}" data-key="context" value="${esc(ref.context || "")}" placeholder="source structure used in [Shot 1]" />
                </label>
                <label class="field">
                  <span>保留方式</span>
                  <select data-entity="references" data-id="${ref.id}" data-key="relation">
                    ${relationOptions.map((item) => option(item, currentRelation, RELATION_LABELS[item] || item)).join("")}
                  </select>
                </label>
                <label class="field full">
                  <span>保留描述</span>
                  <textarea data-entity="references" data-id="${ref.id}" data-key="retention" placeholder="the duration, framing, and camera movement are preserved...">${esc(ref.retention || "")}</textarea>
                </label>
              </div>
            </details>
          </article>`;
        }).join("")}</div>`
      : `<div class="empty-state">尚未添加参考标签</div>`;
    return section(
      "参考素材标签",
      labels.length,
      ["Picture", "Video", "Audio"].map((type) => `<span class="action-with-help">
        <button class="add-button" data-action="add-ref" data-type="${type}">${type}</button>
        ${helpTriggerMarkup(`ref${type}`, "action-help")}
      </span>`).join(""),
      "自动生成引用编号，不上传文件。展开某个标签后，可为作为编辑源或关键帧的资产填写独立定义和保留关系；只提供人物外观的Picture无需填写。",
      cards,
      "references",
    );
  }

  function renderSubjects(modeState) {
    const cards = modeState.subjects.length
      ? modeState.subjects.map((subject, index) => `
          <article class="item-card">
            <div class="item-head">
              <div class="item-label">&lt;Subject ${index + 1}&gt;<em>定义＋保留规则</em></div>
              ${entityButtons("subjects", subject.id, index, modeState.subjects.length)}
            </div>
            <div class="field-grid">
              <label class="field full">
                <span>定义内容（工具自动在前面添加 &lt;Subject ${index + 1}&gt;）</span>
                <textarea data-entity="subjects" data-id="${subject.id}" data-key="definition" placeholder="点击下方通用按钮自动填写，或手动输入英文定义">${esc(subject.definition)}</textarea>
              </label>
              <div class="field full">${renderSubjectTemplateButtons(subject.id)}</div>
              <label class="field">
                <span>出现镜头编号</span>
                <input data-entity="subjects" data-id="${subject.id}" data-key="appears" value="${esc(subject.appears)}" placeholder="1, 2, 3" />
              </label>
              <label class="field">
                <span>保留方式</span>
                <select data-entity="subjects" data-id="${subject.id}" data-key="relation">
                  ${VISUAL_RELATIONS.map((item) => option(item, subject.relation, RELATION_LABELS[item] || item)).join("")}
                </select>
              </label>
              <label class="field full">
                <span>保留描述（工具自动添加关系标记和连接符）</span>
                <textarea data-entity="subjects" data-id="${subject.id}" data-key="retention" placeholder="her face, hairstyle, and clothing remain consistent.">${esc(subject.retention)}</textarea>
              </label>
            </div>
          </article>`).join("")
      : `<div class="empty-state">点击右上角“添加Subject”开始</div>`;
    return section(
      "角色、场景与物体（Subject）",
      modeState.subjects.length,
      `<button class="mini-button sync-button" data-action="sync-subject-appearances" type="button">按Shot同步</button>
       <button class="add-button" data-action="add-subject" type="button">添加Subject</button>`,
      "一张卡片同时管理定义和保留规则，输出时会自动拆入 subject_definitions 与 retention_analysis。",
      cards,
      "subjects",
    );
  }

  function renderSummary(modeState) {
    const checks = TASK_TYPES.map((type) => `
      <label class="check-option">
        <input type="checkbox" data-task-type="${type}" ${modeState.taskTypes.includes(type) ? "checked" : ""} />
        <span><strong>${esc(TASK_TYPE_LABELS[type])}</strong><small>${type}</small></span>
      </label>`).join("");
    const cards = modeState.summaries.length
      ? modeState.summaries.map((item, index) => `
          <article class="item-card">
            <div class="item-head">
              <div class="item-label">Summary ${index + 1}</div>
              ${entityButtons("summaries", item.id, index, modeState.summaries.length)}
            </div>
            <label class="field">
              <span>汇总句</span>
              <textarea data-entity="summaries" data-id="${item.id}" data-key="content" placeholder="The target is an eight-second video...">${esc(item.content)}</textarea>
            </label>
          </article>`).join("")
      : `<div class="empty-state">尚未添加汇总句</div>`;
    return section(
      "任务概述（Summary）",
      modeState.summaries.length,
      `<button class="add-button" data-action="add-summary">添加汇总句</button>`,
      `<div class="check-grid">${checks}</div>多条汇总句会按当前顺序自动连接为同一段。`,
      cards,
      "summary",
    );
  }

  function renderDuration(modeState, mode) {
    const extra = mode === "fl2va" ? `
      <label class="field">
        <span>尾帧所属镜头</span>
        <select data-global="lastShot">
          ${modeState.shots.map((_, index) => option(String(index + 1), String(modeState.lastShot || modeState.shots.length), `Shot ${index + 1}`)).join("")}
        </select>
      </label>` : "";
    const help = mode === "i2va"
      ? "Picture 1会自动绑定到0.00秒和Shot 1。"
      : mode === "fl2va"
        ? "Picture 1固定为首帧；Picture 2自动绑定到总时长和所选尾帧镜头。"
        : "时长用于检查切镜时间，不会额外写入T2VA正文。";
    return section(
      "视频时长",
      null,
      "",
      help,
      `<div class="field-grid ${extra ? "" : "three"}">
        <label class="field">
          <span>总时长（秒）</span>
          <input type="number" min="0.1" step="0.01" data-global="duration" value="${esc(modeState.duration)}" />
        </label>
        ${extra}
      </div>`,
      "duration",
    );
  }

  function stylePhrase(modeState) {
    const selected = Array.isArray(modeState.styles) ? modeState.styles : [];
    const custom = String(modeState.customStyle || "").trim();
    return [...selected, ...(custom ? [custom] : [])].join(", ");
  }

  function renderStyle(modeState) {
    const selected = Array.isArray(modeState.styles) ? modeState.styles : [];
    const mixes = STYLE_MIXES.map((mix) => `
      <button class="style-mix-button" data-action="apply-style-mix" data-style-values="${esc(mix.values.join("|"))}">${esc(mix.label)}</button>`).join("");
    const presets = STYLE_PRESETS.map((preset) => `
      <label class="style-option">
        <input type="checkbox" data-style-preset="${esc(preset.value)}" ${selected.includes(preset.value) ? "checked" : ""} />
        <span><strong>${esc(preset.label)}</strong><small>${esc(preset.note)}</small></span>
      </label>`).join("");
    return section(
      "画面风格",
      selected.length + (String(modeState.customStyle || "").trim() ? 1 : 0),
      "",
      "可单选，也可勾选多个混合。快捷组合只控制勾选项；最终提示词写入右侧显示的英文风格词。",
      `<div class="style-mixes"><span>快捷组合</span>${mixes}</div>
       <div class="style-grid">${presets}</div>
       <label class="field style-custom">
         <span>补充自定义风格词（可选，建议使用英文短语）</span>
         <input data-global="customStyle" value="${esc(modeState.customStyle)}" placeholder="e.g. soft lighting, slightly desaturated color palette" />
       </label>
       <div class="style-result"><span>将写入</span><code>${esc(stylePhrase(modeState) || "尚未选择")}</code></div>`,
      "style",
    );
  }

  function shotPlaceholder(mode, index) {
    if (index > 0) return "从切镜方式开始，例如：the camera cuts to a close-up of ...";
    if (mode === "ref") return "A close shot frames <Subject 1> ...";
    if (mode === "i2va") return "The character shown in <Picture 1> preserves ... then ...";
    if (mode === "fl2va") return "The subject begins from <Picture 1>, changes continuously, and settles into <Picture 2> ...";
    return "A close shot frames ... The subject ... while the camera ...";
  }

  function renderDialogueBuilder(shot, modeState, mode) {
    const subjectOptions = mode === "ref"
      ? `${modeState.subjects.map((_, subjectIndex) => `<option value="&lt;Subject ${subjectIndex + 1}&gt;">Subject ${subjectIndex + 1}</option>`).join("")}
         <option value="">旁白／其他声音</option>`
      : "";
    const speakerCount = Math.max(4, mode === "ref" ? modeState.subjects.length : 0);
    const speakerOptions = Array.from({ length: speakerCount }, (_, speakerIndex) => `<option value="S${speakerIndex + 1}">S${speakerIndex + 1}</option>`).join("");
    const languageOptions = ["Chinese", "English", "Japanese", "Korean"]
      .map((language) => `<option value="${language}">${language}</option>`)
      .join("");
    return `<div class="dialogue-builder" data-shot-id="${esc(shot.id)}">
      <div class="dialogue-builder-title">
        <strong>插入台词</strong>
        <span>S编号按整条视频首次发声顺序分配，跨Shot不重置</span>
        ${helpTriggerMarkup("speakerIds", "dialogue-help")}
      </div>
      <div class="dialogue-builder-controls">
        ${mode === "ref" ? `<label><span>发言主体</span><select data-dialogue-subject>${subjectOptions}</select></label>` : ""}
        <label><span>全局编号</span><select data-dialogue-speaker>${speakerOptions}</select></label>
        <label><span>语言</span><select data-dialogue-language>${languageOptions}</select></label>
        <button class="dialogue-insert-button" type="button" data-action="insert-dialogue" data-id="${esc(shot.id)}">插入并填写</button>
      </div>
    </div>`;
  }

  function renderShotLanguageLibrary(shot) {
    const groups = SHOT_LANGUAGE_GROUPS.map((group) => `
      <section class="shot-language-group" data-shot-language-group="${esc(group.key)}">
        <div class="shot-language-group-title">
          <strong>${esc(group.title)}</strong>
          <span>${esc(group.note)}</span>
        </div>
        <div class="shot-language-grid">
          ${group.items.map((item) => `<button class="shot-language-button" type="button" title="${esc(item.token)}" data-action="insert-token" data-collection="shots" data-id="${esc(shot.id)}" data-key="content" data-token="${esc(item.token)}" data-cursor-back="0"><strong>${esc(item.label)}</strong><small>${esc(item.note)}</small></button>`).join("")}
        </div>
      </section>`).join("");
    return `<details class="shot-language-library">
      <summary>
        <span class="shot-language-summary-copy"><strong>镜头语言库</strong><small>景别 · 视角 · 构图 · 运镜</small></span>
        ${helpTriggerMarkup("shotLanguage", "shot-language-help")}
      </summary>
      <div class="shot-language-content">${groups}</div>
    </details>`;
  }

  function renderSoundLibrary() {
    const groups = SOUND_PRESET_GROUPS.map((group) => `
      <section class="shot-language-group sound-library-group" data-sound-group="${esc(group.key)}">
        <div class="shot-language-group-title">
          <strong>${esc(group.title)}</strong>
          <span>${esc(group.note)}</span>
        </div>
        <div class="shot-language-grid sound-preset-grid">
          ${group.items.map((item) => `<button class="shot-language-button sound-preset-button" type="button" title="${esc(item.token)}" data-action="insert-sound-preset" data-target="${esc(group.target)}" data-token="${esc(item.token)}"><strong>${esc(item.label)}</strong><small>${esc(item.note)}</small></button>`).join("")}
        </div>
      </section>`).join("");
    return `<details class="shot-language-library sound-library">
      <summary>
        <span class="shot-language-summary-copy"><strong>声音快速库</strong><small>环境声 · 动作声 · 人物声音 · 非画面配乐</small></span>
        ${helpTriggerMarkup("soundLibrary", "shot-language-help sound-library-help")}
      </summary>
      <div class="shot-language-content sound-library-content">${groups}</div>
    </details>`;
  }

  function renderShots(modeState, mode) {
    const tokens = availableTokens(modeState, mode);
    const cards = modeState.shots.map((shot, index) => `
      <article class="item-card">
        <div class="item-head">
          <div class="item-label">[Shot ${index + 1}]<em>${index === 0 ? "从0秒开始" : "自动添加At"}</em></div>
          ${entityButtons("shots", shot.id, index, modeState.shots.length)}
        </div>
        <div class="field-grid">
          ${index === 0 ? `
            <label class="field">
              <span>开始时间</span>
              <input value="00:00.000" data-help-field="shotStartFixed" disabled />
            </label>` : `
            <label class="field">
              <span>切镜时间</span>
              <input data-entity="shots" data-id="${shot.id}" data-key="start" value="${esc(shot.start)}" placeholder="3.000 或 00:03.000" />
            </label>`}
          <label class="field ${index === 0 ? "" : ""}">
            <span>输出前缀</span>
            <input value="${index === 0 ? `[Shot ${index + 1}]` : `[Shot ${index + 1}] At ${formatTimestamp(shot.start)},`}" data-help-field="shotPrefix" disabled />
          </label>
          <label class="field full">
            <span>英文镜头描述（中文仅放在台词标签或画面文字中）</span>
            <textarea data-entity="shots" data-id="${shot.id}" data-key="content" placeholder="${esc(shotPlaceholder(mode, index))}">${esc(shot.content)}</textarea>
          </label>
          <div class="field full">${renderShotLanguageLibrary(shot)}${renderDialogueBuilder(shot, modeState, mode)}</div>
          <div class="field full">
            ${renderTokenTools(tokens, "shots", shot.id, "content")}
          </div>
        </div>
      </article>`).join("");
    return section(
      mode === "ref" ? "分镜内容（detailed_description）" : "分镜内容（integrated_multimodal_description）",
      modeState.shots.length,
      `<button class="add-button" data-action="add-shot">添加Shot</button>`,
      `${renderReferenceGuide(mode)}<p class="shot-time-help">推荐顺序：构图与景别 → 主体和环境 → 动作变化 → 摄影机运动 → 同步声音。Shot 1不写时间；Shot 2以后由工具自动添加严格递增的切镜时间。</p>`,
      cards,
      "shots",
    );
  }

  function renderAudio(modeState) {
    return section(
      "声音设置",
      null,
      "",
      "输入内容不会被翻译或改写。",
      `<div class="field-grid">
        <label class="field full">
          <span>overall_soundscape</span>
          <textarea data-global="soundscape" placeholder="Ambient sound, physical action sounds, and non-verbal human sounds...">${esc(modeState.soundscape)}</textarea>
        </label>
        <div class="field full">${renderSoundLibrary()}</div>
        <div class="field full switch-row">
          <div><strong>无非叙事配乐</strong><small>开启后固定输出 non_diegetic_music: N/A</small></div>
          <label class="switch"><input type="checkbox" data-global="noMusic" ${modeState.noMusic ? "checked" : ""} /><span></span></label>
        </div>
        ${modeState.noMusic ? "" : `
          <label class="field full">
            <span>non_diegetic_music</span>
            <textarea data-global="music" placeholder="Instrumentation, tempo, rhythm, and dynamics...">${esc(modeState.music)}</textarea>
          </label>`}
      </div>`,
      "audio",
    );
  }

  function renderEditor(resetScroll = false) {
    closeHelp();
    const mode = store.activeMode;
    const modeState = store.modes[mode];
    const previousScroll = resetScroll ? 0 : editorRoot.scrollTop;
    $("#editor-title").textContent = MODE_META[mode].title;
    $("#mode-badge").textContent = MODE_META[mode].badge;
    $("#mode-guidance").textContent = MODE_META[mode].guidance;
    $("#output-format").textContent = MODE_META[mode].format;
    const focusToggle = $("#focus-toggle");
    focusToggle.textContent = store.focusMode ? "打开完整设置" : "只看分镜";
    focusToggle.classList.toggle("active", store.focusMode);
    focusToggle.setAttribute("aria-pressed", String(store.focusMode));
    renderTaskPresetToolbar(mode);
    document.querySelectorAll(".mode-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
    const fullSections = mode === "ref"
      ? [
        renderDuration(modeState, mode),
        renderStyle(modeState),
        renderReferences(modeState),
        renderSubjects(modeState),
        renderSummary(modeState),
        renderShots(modeState, mode),
        renderAudio(modeState),
      ]
      : [
        renderDuration(modeState, mode),
        renderStyle(modeState),
        renderShots(modeState, mode),
        renderAudio(modeState),
      ];
    const sections = store.focusMode
      ? [renderDuration(modeState, mode), renderShots(modeState, mode), renderAudio(modeState)]
      : fullSections;
    sectionNavHost.innerHTML = renderSectionNav(mode, store.focusMode);
    editorRoot.innerHTML = `${store.focusMode ? `<div class="focus-notice"><strong>专注分镜</strong><span>已隐藏风格、参考定义和任务概述。先应用上方模板，再修改分镜；需要调整素材关系时点击“打开完整设置”。</span></div>` : ""}<div class="editor-sections">${sections.join("")}</div>`;
    decorateParameterHelp();
    editorRoot.scrollTop = previousScroll;
    updateOutput();
    syncActiveSection();
    requestAnimationFrame(syncActiveSection);
  }

  function setActiveSection(targetId) {
    sectionNavHost.querySelectorAll('.section-nav button[data-target]').forEach((button) => {
      const active = button.dataset.target === targetId;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
  }

  function syncActiveSection() {
    const sections = [...editorRoot.querySelectorAll(".editor-sections > .form-section")];
    if (!sections.length) return;
    const rootRect = editorRoot.getBoundingClientRect();
    const internallyScrollable = editorRoot.scrollHeight > editorRoot.clientHeight + 2;
    const activationOffset = Math.min(90, rootRect.height * 0.16);
    const focusLine = internallyScrollable
      ? rootRect.top + activationOffset
      : Math.max(18, rootRect.top + activationOffset);
    let activeSection = sections[0];
    for (const currentSection of sections) {
      if (currentSection.getBoundingClientRect().top <= focusLine) activeSection = currentSection;
      else break;
    }
    setActiveSection(activeSection.id);
  }

  function scrollToSection(targetId) {
    const target = editorRoot.querySelector(`#${targetId}`);
    if (!target) return;
    const internallyScrollable = editorRoot.scrollHeight > editorRoot.clientHeight + 2;
    if (internallyScrollable) {
      const rootTop = editorRoot.getBoundingClientRect().top;
      const targetTop = target.getBoundingClientRect().top;
      editorRoot.scrollTo({
        top: editorRoot.scrollTop + targetTop - rootTop,
        behavior: "auto",
      });
    } else {
      target.scrollIntoView({ behavior: "auto", block: "start" });
    }
    setActiveSection(targetId);
  }

  function parseTime(raw) {
    const value = String(raw ?? "").trim();
    if (!value) return NaN;
    const match = value.match(/^(?:(\d+):)?(\d+(?:\.\d+)?)$/);
    if (!match) return NaN;
    return Number(match[1] || 0) * 60 + Number(match[2]);
  }

  function formatTimestamp(raw) {
    const seconds = parseTime(raw);
    if (!Number.isFinite(seconds)) return "[SET TIME]";
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds - minutes * 60;
    return `${String(minutes).padStart(2, "0")}:${remainder.toFixed(3).padStart(6, "0")}`;
  }

  function formatDuration(raw) {
    const seconds = Number(raw);
    return Number.isFinite(seconds) ? seconds.toFixed(2) : "0.00";
  }

  function formatAppearShots(raw) {
    const values = String(raw ?? "")
      .split(/[,，\s]+/)
      .map((item) => Number(item))
      .filter((item, index, list) => Number.isInteger(item) && item > 0 && list.indexOf(item) === index);
    if (!values.length) return "[Shot 1]";
    return values.map((number) => `[Shot ${number}]`).join(", ");
  }

  function renderShotLines(modeState, firstShotStyle = "") {
    return modeState.shots.map((shot, index) => {
      const body = shot.content.trim();
      if (index === 0) {
        if (!firstShotStyle) return `[Shot 1] ${body}`.trimEnd();
        const style = `${firstShotStyle.charAt(0).toUpperCase()}${firstShotStyle.slice(1)}`;
        const continuedBody = body.replace(/^(A|An|The)\s/, (match) => match.toLowerCase());
        return `[Shot 1] ${style}, ${continuedBody}`.trimEnd();
      }
      return `[Shot ${index + 1}] At ${formatTimestamp(shot.start)}, ${body}`.trimEnd();
    }).join("\n");
  }

  function renderRef(modeState) {
    const subjectDefinitions = modeState.subjects
      .map((subject, index) => `<Subject ${index + 1}> ${subject.definition.trim()}`.trimEnd())
      .filter((line) => line.trim())
      .join("\n");
    const labeledReferences = refLabels(modeState);
    const referenceDefinitions = labeledReferences
      .filter((ref) => String(ref.definition || "").trim())
      .map((ref) => `${ref.label} ${String(ref.definition).trim()}`)
      .join("\n");
    const definitions = [subjectDefinitions, referenceDefinitions].filter(Boolean).join("\n");
    const tasks = modeState.taskTypes.join(" + ");
    const summary = modeState.summaries.map((item) => item.content.trim()).filter(Boolean).join(" ");
    const subjectRetention = modeState.subjects
      .map((subject, index) => `<Subject ${index + 1}> (appears in ${formatAppearShots(subject.appears)}): ${subject.relation} - ${subject.retention.trim()}`.trimEnd())
      .join("\n");
    const referenceRetention = labeledReferences
      .filter((ref) => String(ref.retention || "").trim())
      .map((ref) => {
        const context = String(ref.context || "").trim();
        const relation = ref.relation || (ref.type === "Audio" ? "reference" : "fully_preserved");
        return `${ref.label}${context ? ` (${context})` : ""}: ${relation} - ${String(ref.retention).trim()}`;
      })
      .join("\n");
    const retention = [subjectRetention, referenceRetention].filter(Boolean).join("\n");
    const selectedStyle = stylePhrase(modeState);
    const detailedDescription = [
      selectedStyle ? `The target video uses a ${selectedStyle} visual style.` : "",
      renderShotLines(modeState),
    ].filter(Boolean).join("\n");
    return [
      "subject_definitions:",
      definitions,
      "",
      "summary:",
      `[${tasks}] ${summary}`.trimEnd(),
      "",
      "retention_analysis:",
      retention,
      "",
      "detailed_description:",
      detailedDescription,
      "",
      "overall_soundscape:",
      modeState.soundscape.trim(),
      "",
      "non_diegetic_music:",
      modeState.noMusic ? "N/A" : modeState.music.trim(),
    ].join("\n");
  }

  function renderBase(mode, modeState) {
    const output = [];
    if (mode === "i2va") {
      output.push("For the target video, at 0.00 seconds into the target video, <Picture 1> (from [Shot 1]) is fully referenced.", "");
    }
    if (mode === "fl2va") {
      const shotNumber = Math.max(1, Math.min(modeState.shots.length, Number(modeState.lastShot) || modeState.shots.length));
      output.push(`How the reference pictures align with the target video — Picture 1 (from Shot 1) aligns with the 0.00-second mark of the target video; Picture 2 (from Shot ${shotNumber}) aligns with the ${formatDuration(modeState.duration)}-second mark of the target video.`, "");
    }
    output.push(
      "integrated_multimodal_description:",
      renderShotLines(modeState, stylePhrase(modeState)),
      "",
      "overall_soundscape:",
      modeState.soundscape.trim(),
      "",
      "non_diegetic_music:",
      modeState.noMusic ? "N/A" : modeState.music.trim(),
    );
    return output.join("\n");
  }

  function currentPrompt() {
    const mode = store.activeMode;
    return mode === "ref" ? renderRef(store.modes.ref) : renderBase(mode, store.modes[mode]);
  }

  function containsCjkOutsideAllowedText(value) {
    const stripped = String(value || "")
      .replace(/<d>[\s\S]*?<\/d>/gi, "")
      .replace(/"[^"\r\n]*"/g, "");
    return /[\u3400-\u9fff\uf900-\ufaff]/.test(stripped);
  }

  function checkEnglishField(value, label, warnings) {
    if (String(value || "").trim() && containsCjkOutsideAllowedText(value)) {
      warnings.push(`${label}含中文描述；H3正文应使用英文，中文只保留在台词标签或画面文字双引号中`);
    }
  }

  function pushUnique(list, message) {
    if (!list.includes(message)) list.push(message);
  }

  function parseAppearNumbers(raw) {
    return String(raw || "")
      .split(/[,，\s]+/)
      .map(Number)
      .filter((number, index, list) => Number.isInteger(number) && number > 0 && list.indexOf(number) === index);
  }

  function checkReferenceLabelFormatting(value, errors) {
    const text = String(value || "");
    [...text.matchAll(/<(Subject|Picture|Video|Audio)\s*(\d+)>/gi)].forEach((match) => {
      const type = `${match[1].charAt(0).toUpperCase()}${match[1].slice(1).toLowerCase()}`;
      const normalized = `<${type} ${Number(match[2])}>`;
      if (match[0] !== normalized) pushUnique(errors, `引用标签${match[0]}格式错误，应写为${normalized}`);
    });
    [...text.matchAll(/<S\d+>/gi)].forEach((match) => {
      pushUnique(errors, `说话者${match[0]}格式错误，应使用圆括号${match[0].replace("<", "(").replace(">", ")")}`);
    });
  }

  function estimateDialogueSeconds(content) {
    return [...String(content || "").matchAll(/<d>([\s\S]*?)<\/d>/gi)].reduce((total, block) => {
      const spoken = block[1].trim().replace(/^\[[A-Za-z][A-Za-z -]*\]\s*/, "");
      const cjkCount = (spoken.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
      const words = spoken
        .replace(/[\u3400-\u9fff\uf900-\ufaff]/g, " ")
        .match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];
      return total + cjkCount / 4 + words.length / 2.7;
    }, 0);
  }

  function checkDialogueSyntax(content, shotNumber, mode, errors, warnings, speakerEvents) {
    const openCount = (content.match(/<d>/gi) || []).length;
    const closeCount = (content.match(/<\/d>/gi) || []).length;
    if (openCount !== closeCount) errors.push(`Shot ${shotNumber}的<d>台词标签没有成对闭合`);
    const blocks = [...content.matchAll(/<d>([\s\S]*?)<\/d>/gi)];
    blocks.forEach((block) => {
      if (!/^\[[A-Za-z][A-Za-z -]*\]\s+\S/.test(block[1].trim())) {
        errors.push(`Shot ${shotNumber}的台词必须写成<d>[Language] 原文</d>`);
      }
      const prefix = content.slice(Math.max(0, block.index - 220), block.index);
      const speakerMatches = [...prefix.matchAll(/\((S\d+(?:,S\d+)*)\)/gi)];
      const speakerMatch = speakerMatches.at(-1);
      if (!speakerMatch) {
        warnings.push(`Shot ${shotNumber}的台词前缺少稳定说话者编号，例如(S1)`);
        return;
      }
      const speakerLabel = speakerMatch[1].toUpperCase();
      const ids = speakerLabel.split(",").map((id) => Number(id.slice(1)));
      const pairMatches = [...prefix.matchAll(/<Subject\s+(\d+)>\s*\((S\d+(?:,S\d+)*)\)/gi)];
      const pair = pairMatches.reverse().find((item) => item[2].toUpperCase() === speakerLabel);
      const subjectNumber = pair ? Number(pair[1]) : null;
      if (mode === "ref" && !subjectNumber) {
        pushUnique(warnings, `Shot ${shotNumber}的台词未绑定Subject；已定义人物发言时建议写成<Subject N> (${speakerLabel})`);
      }
      speakerEvents.push({ shotNumber, ids, subjectNumber });
    });
  }

  function validate(mode, modeState, output) {
    const errors = [];
    const warnings = [];
    const speakerEvents = [];
    const duration = Number(modeState.duration);
    checkReferenceLabelFormatting(output, errors);
    if (!Number.isFinite(duration) || duration <= 0) errors.push("总时长无效");
    if (!stylePhrase(modeState)) warnings.push("尚未设置画面风格");
    checkEnglishField(modeState.customStyle, "自定义风格", warnings);
    if (mode === "ref") {
      if (!modeState.subjects.length) errors.push("至少添加一个Subject");
      if (!modeState.taskTypes.length) errors.push("至少选择一个任务类型");
      if (!modeState.summaries.some((item) => item.content.trim())) warnings.push("Summary尚未填写");
      modeState.subjects.forEach((subject, index) => {
        if (!subject.definition.trim()) errors.push(`Subject ${index + 1}缺少定义`);
        if (!subject.retention.trim()) warnings.push(`Subject ${index + 1}缺少保留描述`);
        checkEnglishField(subject.definition, `Subject ${index + 1}定义`, warnings);
        checkEnglishField(subject.retention, `Subject ${index + 1}保留描述`, warnings);
        const rawAppears = String(subject.appears || "").split(/[,，\s]+/).map(Number).filter(Number.isInteger);
        const appears = parseAppearNumbers(subject.appears);
        if (!appears.length) warnings.push(`Subject ${index + 1}尚未填写出现镜头`);
        if (rawAppears.some((shot) => shot < 1 || shot > modeState.shots.length)) errors.push(`Subject ${index + 1}的出现镜头编号超出范围`);
        const label = `<Subject ${index + 1}>`;
        const actualShots = modeState.shots
          .map((shot, shotIndex) => String(shot.content || "").includes(label) ? shotIndex + 1 : null)
          .filter(Boolean);
        if (!actualShots.length) {
          warnings.push(`${label}没有在任何Shot正文中引用`);
        } else {
          const missing = actualShots.filter((shot) => !appears.includes(shot));
          const extra = appears.filter((shot) => !actualShots.includes(shot));
          if (missing.length) warnings.push(`${label}在Shot ${missing.join(", ")}正文出现，但retention_analysis尚未登记`);
          if (extra.length) warnings.push(`${label}登记了Shot ${extra.join(", ")}，但对应Shot正文没有该标签`);
        }
      });
      modeState.summaries.forEach((item, index) => checkEnglishField(item.content, `Summary ${index + 1}`, warnings));
      refLabels(modeState).forEach((ref) => {
        const hasDefinition = Boolean(String(ref.definition || "").trim());
        const hasRetention = Boolean(String(ref.retention || "").trim());
        if (hasDefinition && !hasRetention) warnings.push(`${ref.label}已有独立定义但缺少保留描述`);
        if (!hasDefinition && hasRetention) warnings.push(`${ref.label}已有保留描述但缺少独立定义`);
        checkEnglishField(ref.definition, `${ref.label}定义`, warnings);
        checkEnglishField(ref.context, `${ref.label}作用范围`, warnings);
        checkEnglishField(ref.retention, `${ref.label}保留描述`, warnings);
      });
      const available = new Set(refLabels(modeState).map((item) => item.label));
      modeState.subjects.forEach((_, index) => available.add(`<Subject ${index + 1}>`));
      const tokens = output.match(/<(?:Picture|Video|Audio|Subject) \d+>/g) || [];
      [...new Set(tokens)].forEach((token) => {
        if (!available.has(token)) errors.push(`${token}没有对应的参考标签或Subject定义`);
      });
      const referenceTypes = new Set((modeState.references || []).map((ref) => ref.type));
      if (modeState.taskTypes.includes("video editing") && !referenceTypes.has("Video")) errors.push("video editing任务需要至少一个Video标签");
      if (modeState.taskTypes.includes("video continuation") && !referenceTypes.has("Video")) errors.push("video continuation任务需要至少一个Video标签");
      if ((modeState.taskTypes.includes("audio reuse") || modeState.taskTypes.includes("audio reference")) && !referenceTypes.has("Audio")) errors.push("音频任务需要至少一个Audio标签");
      const authoredText = [
        ...modeState.summaries.map((item) => item.content),
        ...modeState.shots.map((shot) => shot.content),
      ].join(" ");
      if (/\bchar[_-]?\d+\b/i.test(authoredText)) warnings.push("检测到char1、char2等临时别名；建议直接使用<Subject N>保持引用稳定");
    } else if (/<(?:Subject|Video|Audio) \d+>/.test(output) || (mode === "t2va" && /<Picture \d+>/.test(output))) {
      errors.push(`${MODE_META[mode].badge}正文中出现了当前模式不支持的引用标签`);
    }
    let lastTime = 0;
    modeState.shots.forEach((shot, index) => {
      const content = String(shot.content || "");
      if (!content.trim()) warnings.push(`Shot ${index + 1}内容为空`);
      checkEnglishField(content, `Shot ${index + 1}`, warnings);
      checkDialogueSyntax(content, index + 1, mode, errors, warnings, speakerEvents);
      if (/\[Shot\s+\d+\]/i.test(content) || /\bAt\s+\d{2}:\d{2}\.\d{3}\b/i.test(content)) {
        warnings.push(`Shot ${index + 1}内容中重复手写了编号或At时间，工具会自动添加`);
      }
      if (index > 0) {
        const time = parseTime(shot.start);
        if (!Number.isFinite(time)) errors.push(`Shot ${index + 1}切镜时间无效`);
        else {
          if (time <= lastTime) errors.push(`Shot ${index + 1}时间未递增`);
          if (Number.isFinite(duration) && time >= duration) errors.push(`Shot ${index + 1}时间超出总时长`);
          lastTime = time;
        }
        if (content.trim() && !/(?:camera|shot)\s+(?:cuts|transitions|changes|switches)\s+to|cross-dissolves?\s+to|fades?\s+to|wipes?\s+to/i.test(content.slice(0, 140))) {
          warnings.push(`Shot ${index + 1}建议从明确切镜句开始，例如“the camera cuts to ...”`);
        }
      }
    });
    const firstSpeakerOrder = [];
    const subjectToSpeaker = new Map();
    const speakerToSubject = new Map();
    speakerEvents.forEach((event) => {
      event.ids.forEach((id) => {
        if (!firstSpeakerOrder.includes(id)) firstSpeakerOrder.push(id);
      });
      if (!event.subjectNumber || event.ids.length !== 1) return;
      const speakerId = event.ids[0];
      const previousSpeaker = subjectToSpeaker.get(event.subjectNumber);
      const previousSubject = speakerToSubject.get(speakerId);
      if (previousSpeaker && previousSpeaker !== speakerId) {
        pushUnique(errors, `<Subject ${event.subjectNumber}>跨Shot使用了不同Speaker编号：S${previousSpeaker}与S${speakerId}`);
      }
      if (previousSubject && previousSubject !== event.subjectNumber) {
        pushUnique(errors, `(S${speakerId})被绑定到多个Subject：<Subject ${previousSubject}>与<Subject ${event.subjectNumber}>`);
      }
      subjectToSpeaker.set(event.subjectNumber, speakerId);
      speakerToSubject.set(speakerId, event.subjectNumber);
    });
    if (firstSpeakerOrder.some((id, index) => id !== index + 1)) {
      warnings.push(`Speaker应按整条视频首次发声顺序从(S1)连续分配；当前首次出现顺序为${firstSpeakerOrder.map((id) => `(S${id})`).join("、")}`);
    }
    modeState.shots.forEach((shot, index) => {
      const start = index === 0 ? 0 : parseTime(shot.start);
      const end = index === modeState.shots.length - 1 ? duration : parseTime(modeState.shots[index + 1].start);
      const dialogueSeconds = estimateDialogueSeconds(shot.content);
      if (!Number.isFinite(start) || !Number.isFinite(end) || !dialogueSeconds) return;
      const availableSeconds = end - start;
      if (availableSeconds > 0 && dialogueSeconds + 1 > availableSeconds) {
        warnings.push(`Shot ${index + 1}约有${availableSeconds.toFixed(2)}秒，但台词已需约${dialogueSeconds.toFixed(2)}秒，留给表演动作的时间可能不足`);
      }
    });
    if (!modeState.soundscape.trim()) warnings.push("overall_soundscape为空");
    checkEnglishField(modeState.soundscape, "overall_soundscape", warnings);
    if (!modeState.noMusic && !modeState.music.trim()) errors.push("配乐已开启但non_diegetic_music为空；没有配乐请打开“无非叙事配乐”");
    if (!modeState.noMusic) checkEnglishField(modeState.music, "non_diegetic_music", warnings);
    if (mode === "fl2va" && (!Number(modeState.lastShot) || Number(modeState.lastShot) > modeState.shots.length)) errors.push("尾帧镜头无效");
    if (mode === "i2va" && !String(modeState.shots[0]?.content || "").includes("<Picture 1>")) warnings.push("I2VA的Shot 1应明确从<Picture 1>承接画面");
    if (mode === "fl2va") {
      if (modeState.shots.length > 1) warnings.push("FL2VA通常优先使用单镜头连续过渡；只有明确需要切镜时才使用多Shot");
      if (!String(modeState.shots[0]?.content || "").includes("<Picture 1>")) warnings.push("FL2VA开头应明确承接<Picture 1>");
      const finalShot = modeState.shots[Math.max(0, Number(modeState.lastShot || 1) - 1)];
      if (!String(finalShot?.content || "").includes("<Picture 2>")) warnings.push("FL2VA尾帧所属Shot应明确收敛到<Picture 2>");
    }
    return { errors, warnings };
  }

  function renderValidation(result) {
    const tone = result.errors.length ? "error" : result.warnings.length ? "warn" : "ok";
    const label = result.errors.length ? "需要修正" : result.warnings.length ? "结构可用，建议检查" : "格式规范，可直接使用";
    const issues = [
      ...result.errors.map((message) => ({ message, type: "error" })),
      ...result.warnings.map((message) => ({ message, type: "warn" })),
    ];
    validationRoot.innerHTML = `
      <div class="validation-summary">
        <span class="validation-state status-pill ${tone}">${label}</span>
        <span class="validation-counts">${result.errors.length} 错误 · ${result.warnings.length} 提醒</span>
      </div>
      ${issues.length ? `<details ${result.errors.length ? "open" : ""}>
        <summary>查看全部检查结果</summary>
        <ul class="validation-list">${issues.map((item) => `<li class="${item.type}">${esc(item.message)}</li>`).join("")}</ul>
        ${store.focusMode ? `<button class="validation-open-full" id="validation-open-full" type="button">打开完整设置</button>` : ""}
      </details>` : ""}`;
  }

  function updateOutput() {
    const prompt = currentPrompt();
    promptOutput.textContent = prompt;
    currentValidationResult = validate(store.activeMode, store.modes[store.activeMode], prompt);
    renderValidation(currentValidationResult);
    saveStore();
  }

  function findEntity(modeState, collection, id) {
    return (modeState[collection] || []).find((item) => item.id === id);
  }

  function moveEntity(modeState, collection, id, direction) {
    const list = modeState[collection];
    const index = list.findIndex((item) => item.id === id);
    const next = index + Number(direction);
    if (index < 0 || next < 0 || next >= list.length) return;
    [list[index], list[next]] = [list[next], list[index]];
    if (collection === "shots" && store.activeMode === "fl2va") modeState.lastShot = String(list.length);
  }

  function addEntity(action, modeState) {
    if (action === "add-subject") {
      modeState.subjects.push({ id: uid(), definition: "", appears: "1", relation: "fully_preserved", retention: "" });
    } else if (action === "add-summary") {
      modeState.summaries.push({ id: uid(), content: "" });
    } else if (action === "add-shot") {
      modeState.shots.push({ id: uid(), start: "", content: "" });
      if (store.activeMode === "fl2va") modeState.lastShot = String(modeState.shots.length);
    }
  }

  function syncSubjectAppearances(modeState) {
    let synced = 0;
    modeState.subjects.forEach((subject, subjectIndex) => {
      const label = `<Subject ${subjectIndex + 1}>`;
      const shots = modeState.shots
        .map((shot, shotIndex) => String(shot.content || "").includes(label) ? shotIndex + 1 : null)
        .filter(Boolean);
      if (!shots.length) return;
      subject.appears = shots.join(", ");
      synced += 1;
    });
    return synced;
  }

  function ensurePictureReferences(modeState, targetCount) {
    let count = (modeState.references || []).filter((ref) => ref.type === "Picture").length;
    while (count < targetCount) {
      modeState.references.push(createReference("Picture"));
      count += 1;
    }
  }

  function applySubjectTemplate(modeState, subjectId, template) {
    const index = modeState.subjects.findIndex((subject) => subject.id === subjectId);
    if (index < 0) return false;
    const subject = modeState.subjects[index];
    const pictureNumber = index + 1;
    const picture = `<Picture ${pictureNumber}>`;
    ensurePictureReferences(modeState, pictureNumber);
    const templates = {
      "character-identity": {
        definition: `is the character in ${picture}, preserving identity, facial or defining features, head or hairstyle design, surface colors, and body proportions; clothing and accessories from ${picture} are not referenced.`,
        retention: `the identity, facial or defining features, head or hairstyle design, surface colors, and body proportions established by ${picture} remain consistent; reference clothing and accessories are excluded.`,
      },
      "character-full": {
        definition: `is the character in ${picture}, preserving identity, defining features, silhouette, colors, clothing, accessories, and body proportions.`,
        retention: `the identity, defining features, silhouette, colors, clothing, accessories, and body proportions established by ${picture} remain consistent.`,
      },
      scene: {
        definition: `is the environment in ${picture}, preserving its spatial layout, lighting direction, background objects, materials, and color palette.`,
        retention: `the spatial layout, lighting direction, background objects, materials, and color palette established by ${picture} remain consistent.`,
      },
      object: {
        definition: `is the object in ${picture}, preserving its shape, proportions, material, color, surface details, and distinctive features.`,
        retention: `the shape, proportions, material, color, surface details, and distinctive features established by ${picture} remain consistent.`,
      },
    };
    const selected = templates[template];
    if (!selected) return false;
    subject.definition = selected.definition;
    subject.retention = selected.retention;
    subject.relation = "fully_preserved";
    subject.appears = modeState.shots.map((_, shotIndex) => shotIndex + 1).join(", ") || "1";
    return true;
  }

  function applyReferenceTemplate(modeState, referenceId, template) {
    const ref = findEntity(modeState, "references", referenceId);
    if (!ref) return false;
    const templates = {
      "picture-subject-source": { definition: "", context: "", relation: "fully_preserved", retention: "", expanded: false },
      "picture-keyframe": {
        definition: "is a concrete keyframe and composition anchor for [Shot 1].",
        context: "[Shot 1] keyframe",
        relation: "fully_preserved",
        retention: "the composition, subject placement, camera angle, lighting, and visible object arrangement are retained as the target keyframe.",
        expanded: true,
      },
      "video-edit": {
        definition: "is the source video for the target video edit, providing the original duration, shot structure, framing, camera movement, action timing, environment, lighting, and subject performances.",
        context: "source video structure used throughout the target video",
        relation: "partially_preserved",
        retention: "the duration, framing, camera movement, cuts, action timing, environment, lighting, and unchanged subject performances are preserved, while only the explicitly requested content is modified.",
        expanded: true,
      },
      "video-continuation": {
        definition: "is the source video whose final visual and temporal state provides the continuation starting point.",
        context: "continuation source and final state",
        relation: "fully_preserved",
        retention: "the source video's final composition, subject state, motion direction, lighting, and spatial relationships are preserved at the beginning of the continuation.",
        expanded: true,
      },
      "video-camera": {
        definition: "is the camera-movement, cut, pacing, and temporal-rhythm reference for the target video.",
        context: "camera movement, cuts, pacing, and temporal rhythm",
        relation: "weak_reference",
        retention: "the broad camera movement, cut rhythm, pacing, and temporal structure guide the target video without copying the source content directly.",
        expanded: true,
      },
      "audio-copy": {
        definition: "is the audio signal reused as the target video's complete synchronized final audio track.",
        context: "",
        relation: "fully_copy",
        retention: "the complete source audio signal is reused 1:1 as the target video's final audio track.",
        expanded: true,
      },
      "audio-voice": {
        definition: "is the voice-timbre and delivery reference for <Subject 1> (S1).",
        context: "voice timbre and delivery",
        relation: "reference",
        retention: "the target speaker follows the referenced vocal timbre and delivery without copying the original signal.",
        expanded: true,
      },
      "audio-music": {
        definition: "is the background-music style, instrumentation, tempo, and arrangement reference for the target video.",
        context: "background-music style and arrangement",
        relation: "reference",
        retention: "the target score follows the referenced instrumentation, tempo, rhythm, and arrangement without copying the original signal.",
        expanded: true,
      },
    };
    const selected = templates[template];
    if (!selected) return false;
    Object.assign(ref, selected);
    return true;
  }

  function applySelectedTaskPreset(presetId) {
    const mode = store.activeMode;
    const builtIn = BUILT_IN_PRESETS.find((preset) => preset.id === presetId && preset.mode === mode);
    const custom = store.customPresets.find((preset) => preset.id === presetId && preset.mode === mode);
    const selected = builtIn || custom;
    if (!selected) return;
    if (!confirm(`应用“${selected.title}”会替换当前${MODE_META[mode].title}内容，是否继续？`)) return;
    recordHistory("apply-preset");
    store.modes[mode] = builtIn
      ? builtIn.factory(store.modes[mode].duration)
      : cloneModeState(custom.state);
    renderEditor(true);
    showToast(`已应用${selected.title}`);
  }

  function setPresetToolbarState(presetId) {
    const applyButton = taskPresetToolbar.querySelector("#task-preset-apply");
    const deleteButton = taskPresetToolbar.querySelector("#task-preset-delete");
    if (applyButton) applyButton.disabled = !presetId;
    if (deleteButton) {
      deleteButton.disabled = !store.customPresets.some((preset) => preset.id === presetId && preset.mode === store.activeMode);
    }
  }

  function saveCustomPreset() {
    const mode = store.activeMode;
    const suggested = `我的${MODE_META[mode].title}预设`;
    const entered = prompt("给当前内容起一个预设名称：", suggested);
    if (entered === null) return;
    const title = entered.trim().slice(0, 40);
    if (!title) {
      showToast("预设名称不能为空");
      return;
    }
    const existing = store.customPresets.find((preset) => preset.mode === mode && preset.title === title);
    if (existing && !confirm(`“${title}”已经存在，是否用当前内容覆盖？`)) return;
    recordHistory("save-custom-preset");
    const preset = existing || { id: `custom-${uid()}`, mode, title };
    preset.title = title;
    preset.state = cloneModeState(store.modes[mode]);
    preset.updatedAt = new Date().toISOString();
    if (!existing) store.customPresets.push(preset);
    saveStore();
    renderTaskPresetToolbar(mode);
    const select = taskPresetToolbar.querySelector("#task-preset-select");
    if (select) select.value = preset.id;
    setPresetToolbarState(preset.id);
    showToast(existing ? "已更新自定义预设" : "已添加自定义预设");
  }

  function deleteCustomPreset(presetId) {
    const preset = store.customPresets.find((item) => item.id === presetId && item.mode === store.activeMode);
    if (!preset) return;
    if (!confirm(`确定删除自定义预设“${preset.title}”吗？`)) return;
    recordHistory("delete-custom-preset");
    store.customPresets = store.customPresets.filter((item) => item.id !== preset.id);
    saveStore();
    renderTaskPresetToolbar(store.activeMode);
    showToast("已删除自定义预设");
  }

  function insertToken(button, modeState) {
    const { id, key, token } = button.dataset;
    const collection = button.dataset.entity || button.dataset.collection;
    const item = findEntity(modeState, collection, id);
    const textarea = editorRoot.querySelector(
      `textarea[data-entity="${collection}"][data-id="${id}"][data-key="${key}"]`,
    );
    if (!item || !textarea || !token) return;

    const value = textarea.value;
    const start = Number.isInteger(textarea.selectionStart) ? textarea.selectionStart : value.length;
    const end = Number.isInteger(textarea.selectionEnd) ? textarea.selectionEnd : start;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const leftSpace = before && !/\s$/.test(before) ? " " : "";
    const rightSpace = after && !/^(?:\s|[.,;:!?])/.test(after) ? " " : "";
    const insertion = `${leftSpace}${token}${rightSpace}`;
    const nextValue = `${before}${insertion}${after}`;

    recordHistory(`insert:${collection}:${id}:${key}`);
    item[key] = nextValue;
    textarea.value = nextValue;
    const cursorBack = Math.max(0, Number(button.dataset.cursorBack) || 0);
    const caret = Math.max(before.length, before.length + insertion.length - cursorBack - rightSpace.length);
    textarea.focus();
    textarea.setSelectionRange(caret, caret);
    updateOutput();
  }

  function insertDialogue(button, modeState) {
    const builder = button.closest(".dialogue-builder");
    if (!builder) return;
    const subject = builder.querySelector("[data-dialogue-subject]")?.value || "";
    const speaker = builder.querySelector("[data-dialogue-speaker]")?.value || "S1";
    const language = builder.querySelector("[data-dialogue-language]")?.value || "Chinese";
    button.dataset.collection = "shots";
    button.dataset.key = "content";
    button.dataset.token = `${subject ? `${subject} ` : ""}(${speaker}) says, <d>[${language}] </d>`;
    button.dataset.cursorBack = "4";
    insertToken(button, modeState);
  }

  function insertSoundPreset(button, modeState) {
    const key = button.dataset.target;
    const token = button.dataset.token;
    if (!['soundscape', 'music'].includes(key) || !token) return;

    let textarea = editorRoot.querySelector(`textarea[data-global="${key}"]`);
    let value = String(modeState[key] || "");
    if (value.trim() === "N/A") value = "";
    const start = textarea && Number.isInteger(textarea.selectionStart) ? textarea.selectionStart : value.length;
    const end = textarea && Number.isInteger(textarea.selectionEnd) ? textarea.selectionEnd : start;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const leftSpace = before && !/\s$/.test(before) ? " " : "";
    const rightSpace = after && !/^\s/.test(after) ? " " : "";
    const insertion = `${leftSpace}${token}${rightSpace}`;
    const nextValue = `${before}${insertion}${after}`;
    const caret = before.length + insertion.length - rightSpace.length;

    recordHistory(`insert-sound-preset:${key}`);
    modeState[key] = nextValue;
    const needsMusicField = key === "music" && modeState.noMusic;
    if (needsMusicField) {
      modeState.noMusic = false;
      renderEditor();
      textarea = editorRoot.querySelector('textarea[data-global="music"]');
    } else {
      if (textarea) textarea.value = nextValue;
      updateOutput();
    }
    if (textarea) {
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    }
  }

  sectionNavHost.addEventListener("click", (event) => {
    const button = event.target.closest('button[data-action="jump-section"]');
    if (!button) return;
    scrollToSection(button.dataset.target);
  });

  taskPresetToolbar.addEventListener("change", (event) => {
    if (event.target.id !== "task-preset-select") return;
    const selected = BUILT_IN_PRESETS.find((preset) => preset.id === event.target.value)
      || store.customPresets.find((preset) => preset.id === event.target.value);
    taskPresetToolbar.title = selected?.description || "";
    const description = taskPresetToolbar.querySelector("#preset-description");
    if (description) description.textContent = selected?.description || "模板会自动准备规范字段；应用后仍可自由修改。";
    setPresetToolbarState(event.target.value);
  });

  taskPresetToolbar.addEventListener("click", (event) => {
    const select = taskPresetToolbar.querySelector("#task-preset-select");
    if (event.target.id === "task-preset-apply" && select?.value) applySelectedTaskPreset(select.value);
    if (event.target.id === "task-preset-save") saveCustomPreset();
    if (event.target.id === "task-preset-delete" && select?.value) deleteCustomPreset(select.value);
  });

  $("#focus-toggle").addEventListener("click", () => {
    store.focusMode = !store.focusMode;
    renderEditor(true);
    showToast(store.focusMode ? "已进入专注分镜" : "已打开完整设置");
  });

  validationRoot.addEventListener("click", (event) => {
    if (event.target.id !== "validation-open-full") return;
    store.focusMode = false;
    renderEditor(true);
    showToast("已打开完整设置");
  });

  editorRoot.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const modeState = store.modes[store.activeMode];
    const action = button.dataset.action;
    if (action === "apply-subject-template") {
      recordHistory("apply-subject-template");
      if (applySubjectTemplate(modeState, button.dataset.id, button.dataset.template)) {
        renderEditor();
        showToast("已填写Subject定义与保留规则");
      }
      return;
    }
    if (action === "apply-reference-template") {
      recordHistory("apply-reference-template");
      if (applyReferenceTemplate(modeState, button.dataset.id, button.dataset.template)) {
        renderEditor();
        showToast("已填写参考资产定义与保留规则");
      }
      return;
    }
    if (action === "insert-token") {
      insertToken(button, modeState);
      return;
    }
    if (action === "insert-dialogue") {
      insertDialogue(button, modeState);
      return;
    }
    if (action === "insert-sound-preset") {
      insertSoundPreset(button, modeState);
      return;
    }
    if (action === "apply-style-mix") {
      recordHistory("apply-style-mix");
      modeState.styles = button.dataset.styleValues.split("|").filter(Boolean);
      renderEditor();
      editorRoot.querySelector("#section-style")?.scrollIntoView({ block: "start" });
      return;
    }
    if (action === "sync-subject-appearances") {
      recordHistory("sync-subject-appearances");
      const synced = syncSubjectAppearances(modeState);
      renderEditor();
      showToast(synced ? `已同步${synced}个Subject的出现镜头` : "Shot正文中还没有Subject引用");
      return;
    }
    if (action === "add-ref") {
      recordHistory("add-reference");
      modeState.references.push(createReference(button.dataset.type));
    } else if (action === "delete-ref") {
      recordHistory("delete-reference");
      modeState.references = modeState.references.filter((item) => item.id !== button.dataset.id);
    } else if (["add-subject", "add-summary", "add-shot"].includes(action)) {
      recordHistory(action);
      addEntity(action, modeState);
    } else if (action === "delete") {
      const list = modeState[button.dataset.kind];
      if (button.dataset.kind === "shots" && list.length === 1) {
        showToast("至少保留一个Shot");
        return;
      }
      recordHistory(`delete-${button.dataset.kind}`);
      modeState[button.dataset.kind] = list.filter((item) => item.id !== button.dataset.id);
      if (button.dataset.kind === "shots" && store.activeMode === "fl2va") modeState.lastShot = String(modeState.shots.length);
    } else if (action === "move") {
      recordHistory(`move-${button.dataset.kind}`);
      moveEntity(modeState, button.dataset.kind, button.dataset.id, button.dataset.dir);
    }
    renderEditor();
  });

  function handleField(event) {
    const target = event.target;
    const modeState = store.modes[store.activeMode];
    if (target.dataset.taskType) {
      const type = target.dataset.taskType;
      const alreadyChecked = modeState.taskTypes.includes(type);
      if (alreadyChecked === target.checked) return;
      recordHistory(`task-type:${type}`, event.type === "input");
      if (target.checked && !modeState.taskTypes.includes(type)) modeState.taskTypes.push(type);
      if (!target.checked) modeState.taskTypes = modeState.taskTypes.filter((item) => item !== type);
      updateOutput();
      return;
    }
    if (target.dataset.stylePreset) {
      const preset = target.dataset.stylePreset;
      const alreadyChecked = modeState.styles.includes(preset);
      if (alreadyChecked === target.checked) return;
      recordHistory(`style:${preset}`, event.type === "input");
      if (target.checked && !modeState.styles.includes(preset)) modeState.styles.push(preset);
      if (!target.checked) modeState.styles = modeState.styles.filter((item) => item !== preset);
      renderEditor();
      return;
    }
    if (target.dataset.global) {
      const key = target.dataset.global;
      const nextValue = target.type === "checkbox" ? target.checked : target.value;
      if (modeState[key] === nextValue) return;
      recordHistory(`global:${key}`, event.type === "input");
      modeState[key] = nextValue;
      if (target.dataset.global === "noMusic") renderEditor();
      else {
        if (target.dataset.global === "customStyle") {
          const sectionRoot = editorRoot.querySelector("#section-style");
          const readout = sectionRoot?.querySelector(".style-result code");
          const count = sectionRoot?.querySelector(".section-count");
          if (readout) readout.textContent = stylePhrase(modeState) || "尚未选择";
          if (count) count.textContent = modeState.styles.length + (target.value.trim() ? 1 : 0);
        }
        updateOutput();
      }
      return;
    }
    if (target.dataset.entity) {
      const entity = findEntity(modeState, target.dataset.entity, target.dataset.id);
      if (!entity) return;
      const key = target.dataset.key;
      if (entity[key] === target.value) return;
      recordHistory(`entity:${target.dataset.entity}:${target.dataset.id}:${key}`, event.type === "input");
      entity[key] = target.value;
      updateOutput();
    }
  }

  editorRoot.addEventListener("input", handleField);
  editorRoot.addEventListener("change", handleField);
  editorRoot.addEventListener("scroll", syncActiveSection, { passive: true });
  window.addEventListener("scroll", syncActiveSection, { passive: true });

  document.addEventListener("pointerover", (event) => {
    const trigger = event.target.closest?.(".help-trigger[data-help-key]");
    if (!trigger || helpPinned) return;
    showHelp(trigger.dataset.helpKey, trigger, false);
  });

  document.addEventListener("pointerout", (event) => {
    const trigger = event.target.closest?.(".help-trigger[data-help-key]");
    if (!trigger || helpPinned || trigger.contains(event.relatedTarget)) return;
    scheduleHelpClose();
  });

  document.addEventListener("focusin", (event) => {
    const trigger = event.target.closest?.(".help-trigger[data-help-key]");
    if (trigger && !helpPinned) showHelp(trigger.dataset.helpKey, trigger, false);
  });

  document.addEventListener("focusout", (event) => {
    if (event.target.closest?.(".help-trigger[data-help-key]") && !helpPinned) scheduleHelpClose();
  });

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest?.(".help-trigger[data-help-key]");
    if (trigger) {
      event.preventDefault();
      event.stopPropagation();
      if (helpPinned && helpAnchor === trigger) closeHelp();
      else showHelp(trigger.dataset.helpKey, trigger, true);
      return;
    }
    if (helpPinned && !helpPopover.contains(event.target)) closeHelp();
    const projectMenu = $("#project-menu");
    if (projectMenu.open && !projectMenu.contains(event.target)) projectMenu.removeAttribute("open");
  }, true);

  $("#help-close").addEventListener("click", closeHelp);
  helpPopover.addEventListener("pointerenter", () => clearTimeout(helpHideTimer));
  helpPopover.addEventListener("pointerleave", scheduleHelpClose);
  document.addEventListener("keydown", (event) => {
    const modifier = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (modifier && !event.altKey && key === "z") {
      event.preventDefault();
      if (event.shiftKey) redoEdit();
      else undoEdit();
      return;
    }
    if (modifier && !event.altKey && key === "y") {
      event.preventDefault();
      redoEdit();
      return;
    }
    if (event.key === "Escape" && !helpPopover.hidden) closeHelp();
  });
  window.addEventListener("resize", () => {
    if (!helpPopover.hidden) positionHelpPopover(helpAnchor);
  });
  editorRoot.addEventListener("scroll", () => {
    if (!helpPopover.hidden) positionHelpPopover(helpAnchor);
  }, { passive: true });

  document.querySelectorAll(".mode-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      store.activeMode = tab.dataset.mode;
      renderEditor(true);
    });
  });

  $("#undo-action").addEventListener("click", undoEdit);
  $("#redo-action").addEventListener("click", redoEdit);

  $("#load-sample").addEventListener("click", () => {
    recordHistory("load-sample");
    store.modes[store.activeMode] = sampleMode(store.activeMode);
    $("#project-menu").removeAttribute("open");
    renderEditor(true);
    showToast("已载入当前模式示例");
  });

  $("#reset-mode").addEventListener("click", () => {
    if (!confirm(`确定清空“${MODE_META[store.activeMode].title}”当前内容吗？`)) return;
    recordHistory("reset-mode");
    store.modes[store.activeMode] = blankMode(store.activeMode);
    store.focusMode = false;
    $("#project-menu").removeAttribute("open");
    renderEditor(true);
    showToast("当前模式已清空");
  });

  $("#export-workspace").addEventListener("click", () => {
    const payload = {
      application: "MiniMax H3 Prompts Studio",
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      workspace: store,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `minimax-h3-prompts-studio-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    $("#project-menu").removeAttribute("open");
    showToast("工作区备份已导出");
  });

  $("#import-workspace").addEventListener("click", () => {
    $("#workspace-file").click();
  });

  $("#workspace-file").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const imported = normalizeStore(parsed.workspace || parsed, true);
      if (!confirm("导入会替换当前四种模式内容和自定义模板，是否继续？")) return;
      recordHistory("import-workspace");
      store = imported;
      saveStore();
      renderEditor(true);
      showToast("工作区已导入");
    } catch (error) {
      showToast(`导入失败：${error.message || "文件格式无效"}`);
    } finally {
      event.target.value = "";
      $("#project-menu").removeAttribute("open");
    }
  });

  $("#copy-output").addEventListener("click", async () => {
    const value = currentPrompt();
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const input = document.createElement("textarea");
      input.value = value;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    showToast(currentValidationResult.errors.length ? `已复制；仍有${currentValidationResult.errors.length}个错误` : "提示词已复制");
  });

  $("#download-output").addEventListener("click", () => {
    const blob = new Blob([currentPrompt()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = MODE_META[store.activeMode].filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    showToast(currentValidationResult.errors.length ? `TXT已生成；仍有${currentValidationResult.errors.length}个错误` : "TXT已生成");
  });

  function showToast(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  renderEditor(true);
  updateHistoryControls();
})();
