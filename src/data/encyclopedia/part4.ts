// 마취·통증 / 감염관리 / 영상·장비 / 재료 / 전신질환 / 증상 / 보험제도
export const part4 = `
local-anesthesia|국소 마취|Local Anesthesia|마취·통증관리|치료 부위 신경만 일시적으로 마비시켜 통증을 없애는 마취입니다. 의식은 그대로 유지되며 2~3시간 후 풀립니다.|restorative,endodontics,oral-surgery
infiltration-anesthesia|침윤 마취|Infiltration Anesthesia|마취·통증관리|치료할 치아 근처 잇몸에 약을 넣어 그 부위만 마취하는 가장 흔한 방법입니다.|restorative
block-anesthesia|전달 마취|Nerve Block Anesthesia|마취·통증관리|신경 줄기에 마취해 아래턱 한쪽 전체를 마비시키는 방법입니다. 아래 어금니·사랑니 치료에 사용되며 입술까지 얼얼해집니다.|wisdom-tooth,endodontics
intraosseous-anesthesia|골내 마취|Intraosseous Anesthesia|마취·통증관리|골내 마취는 치아 주변 해면골 쪽으로 약액을 전달하는 접근입니다.|vpt-crown,endodontics,periodontal
quicksleeper|퀵슬리퍼|QuickSleeper|영상·진단장비|전동 회전 방식으로 뼛속에 마취하는 골내 마취 장비입니다. 통증이 적고 마취 실패가 적어 신경치료·잇몸치료에 활용됩니다.|vpt-crown,endodontics
denops|데놉스(DENOPS)|DENOPS|영상·진단장비|데놉스는 치과 마취 장비의 제품명으로, 실제 적용 방식은 사용 모델과 임상 상황에 따라 확인해야 합니다.|endodontics
topical-anesthesia|표면(도포) 마취|Topical Anesthesia|마취·통증관리|주사 전 잇몸에 바르는 젤 형태의 마취제입니다. 바늘이 들어갈 때의 따끔함을 줄여줍니다.|pediatric,restorative
computer-controlled-anesthesia|컴퓨터 제어 마취|Computer-controlled Anesthesia|마취·통증관리|컴퓨터 제어 마취는 약액 주입 속도 등 일부 과정을 기계로 조절하는 방식입니다.|pediatric,restorative
iject|아이젭트(I-JECT)|I-JECT|영상·진단장비|아이젭트는 마취액 주입을 보조하는 장비의 제품명입니다.|pediatric,restorative
anesthetic-warmer|마취액 워머|Anesthetic Warmer|영상·진단장비|마취액 워머는 마취액 온도를 조절하는 장비입니다.|restorative,endodontics
lidocaine|리도카인|Lidocaine|재료|리도카인은 치과 국소마취에 사용하는 약물 중 하나입니다.|restorative
articaine|아티카인|Articaine|재료|뼈 투과력이 좋아 침윤 마취 효과가 뛰어난 마취제입니다. 위턱 어금니나 마취가 잘 안 되는 부위에 사용합니다.|endodontics
epinephrine|에피네프린|Epinephrine|재료|마취약에 섞는 혈관 수축제로 마취 시간을 늘리고 출혈을 줄입니다. 심장 질환이 있으면 미리 알려주셔야 합니다.|oral-surgery
anesthesia-duration|마취 지속 시간|Anesthesia Duration|마취·통증관리|보통 1~3시간이며 전달 마취는 더 오래갑니다. 풀리기 전에는 입술·혀를 씹지 않도록 식사를 피하세요.|restorative
dental-anxiety|치과 공포증|Dental Anxiety|마취·통증관리|치과 공포는 통증·소리·구역감·과거 경험 등 이유가 다양합니다.|pediatric,restorative
pain-control|통증 조절|Pain Management|마취·통증관리|통증 조절은 원인 치료, 마취와 필요한 약물·회복 관리를 함께 계획하는 과정입니다.|oral-surgery,endodontics
nsaid|소염진통제|NSAIDs|전신질환·약물|비스테로이드성 소염진통제는 통증과 염증 조절에 쓰는 약물군입니다.|oral-surgery
acetaminophen|아세트아미노펜|Acetaminophen|전신질환·약물|아세트아미노펜은 통증·발열 조절에 쓰이며 소염진통제와 작용 특성이 다릅니다.|oral-surgery
premedication|예방적 항생제|Antibiotic Prophylaxis|전신질환·약물|치과의 예방적 항생제는 특정 심장질환 등 선택된 고위험 상황과 시술 조건에서 검토합니다.|oral-surgery,implant
infection-control|감염관리|Infection Control|감염관리·소독|치과 감염관리는 손 위생·보호구, 기구 재처리와 표면·수관 관리 등 여러 과정을 포함합니다.|preventive
sterilization|멸균|Sterilization|감염관리·소독|모든 미생물과 포자를 완전히 제거하는 과정입니다. 고압증기(오토클레이브)·플라즈마 멸균이 대표적입니다.|preventive
disinfection|소독|Disinfection|감염관리·소독|병원성 미생물 대부분을 제거하는 과정으로 멸균보다 낮은 단계입니다. 표면·체어·손잡이에 적용합니다.|preventive
autoclave|고압증기멸균기(오토클레이브)|Autoclave|감염관리·소독|고압증기멸균기는 적절한 증기·온도·시간 조건으로 기구를 멸균하는 장비입니다.|preventive
class-b-autoclave|B클래스 멸균기|Class B Autoclave|감염관리·소독|B클래스는 소형 증기멸균기의 특정 주기 성능 분류와 관련한 표현입니다.|preventive
plasma-sterilizer|플라즈마 멸균기|Plasma Sterilizer|감염관리·소독|플라즈마 등 저온 멸균 장비는 열에 민감한 특정 기구에서 검토하는 방식입니다.|preventive
sterilization-pouch|멸균 파우치|Sterilization Pouch|감염관리·소독|기구를 넣어 멸균한 뒤 사용 직전까지 봉인 상태를 유지하는 포장입니다. 색이 변하는 표시로 멸균 여부를 확인합니다.|preventive
handpiece-sterilization|핸드피스 멸균|Handpiece Sterilization|감염관리·소독|치아를 깎는 드릴(핸드피스)을 환자마다 교체·멸균하는 것입니다. 내부에 침·혈액이 역류할 수 있어 매 환자 멸균이 필수입니다.|preventive
disposable|일회용품|Disposables|감염관리·소독|장갑·마스크·컵·석션팁·주사침 등 한 번 쓰고 버리는 용품입니다. 교차 감염 예방의 기본입니다.|preventive
surface-barrier|표면 보호 커버|Surface Barrier|감염관리·소독|체어·라이트 손잡이·키보드 등 자주 만지는 표면을 덮는 일회용 필름입니다.|preventive
waterline|치과 수관 관리|Dental Unit Waterline|감염관리·소독|치과 체어에서 나오는 물이 지나는 관을 소독·관리하는 것입니다. 정기 소독으로 세균막 형성을 막습니다.|preventive
aerosol|에어로졸|Aerosol|감염관리·소독|치료 중 물과 함께 공기 중으로 퍼지는 미세 물방울입니다. 강한 석션과 환기로 확산을 줄입니다.|preventive
high-volume-suction|고속 흡입기|High-volume Evacuation|감염관리·소독|치료 중 물·침·에어로졸을 빠르게 빨아들이는 장치입니다.|preventive
hand-hygiene|손 위생|Hand Hygiene|감염관리·소독|손 위생은 손에 묻은 오염과 미생물 전달을 줄이는 기본 과정입니다.|preventive
radiation-dose|방사선 노출량|Radiation Dose|영상·진단장비|치과 영상의 방사선량은 장비·촬영 범위·조건과 환자 크기에 따라 달라집니다.|preventive
low-dose-ct|저선량 CT|Low-dose CT|영상·진단장비|저선량 CT는 진단 목적에 필요한 화질을 유지하면서 노출을 줄이려는 촬영 설정·방식을 말합니다.|implant,wisdom-tooth
digital-xray|디지털 X-ray|Digital Radiography|영상·진단장비|필름 대신 디지털 센서로 촬영해 방사선량이 적고 즉시 확인할 수 있는 방식입니다.|preventive
intraoral-sensor|구내 센서|Intraoral Sensor|영상·진단장비|입안에 넣어 치아 1~3개를 정밀하게 촬영하는 디지털 센서입니다. 충치·뿌리 끝 병소 확인에 사용합니다.|restorative,endodontics
periapical-xray|치근단 X-ray|Periapical Radiograph|영상·진단장비|치아 하나하나의 뿌리 끝까지 보이는 정밀 사진입니다. 신경치료와 충치 진단의 기본입니다.|endodontics,restorative
bitewing|교익 X-ray|Bitewing Radiograph|영상·진단장비|위아래 치아 사이 충치와 뼈 높이를 함께 보는 촬영입니다. 치간 충치 발견에 가장 유용합니다.|restorative,periodontal
portable-xray|포터블 X-ray|Portable X-ray|영상·진단장비|진료실에서 바로 촬영할 수 있는 이동형 X-ray 장비입니다. 신경치료 중 이동 없이 확인이 가능합니다.|endodontics
intraoral-camera|구강 카메라|Intraoral Camera|영상·진단장비|입안을 확대 촬영해 모니터로 보여주는 카메라입니다. 환자가 본인의 치아 상태를 직접 확인하며 설명을 들을 수 있습니다.|preventive
led-light|LED 무영등|LED Operating Light|영상·진단장비|그림자가 생기지 않도록 설계된 진료용 조명입니다. 정확한 색상 확인을 위해 색온도가 관리됩니다.|restorative
dental-unit|유니트 체어|Dental Unit Chair|영상·진단장비|유니트 체어는 환자 의자와 조명·급수·흡입 등 진료 장치가 결합된 설비입니다.|preventive
handpiece|핸드피스|Dental Handpiece|영상·진단장비|핸드피스는 치아 삭제·수복물 조정 등에 쓰는 회전 기구입니다.|restorative
ultrasonic-scaler|초음파 스케일러|Ultrasonic Scaler|영상·진단장비|초음파 스케일러는 진동하는 팁과 물을 이용해 치석 등을 제거하는 기구입니다.|periodontal
warm-water-scaling|온수 스케일링|Warm Water Scaling|치주(잇몸)|스케일링 중 나오는 물을 체온에 가깝게 데워 시린 느낌을 줄이는 방식입니다. 잇몸이 예민한 분도 편하게 받을 수 있습니다.|periodontal,preventive
piezo|피에조 장비|Piezoelectric Device|영상·진단장비|피에조 장비는 압전 진동을 이용하며 뼈 수술 등 목적에 따라 사용합니다.|implant,oral-surgery
laser-dentistry|치과 레이저|Dental Laser|영상·진단장비|연조직 절개·소독·통증 완화에 사용하는 레이저입니다. 출혈이 적고 회복이 빠릅니다.|periodontal
composite-material|복합레진 재료|Composite Material|재료|레진 기질과 필러 입자로 구성된 치아색 충전재입니다. 필러 크기에 따라 강도와 광택이 달라집니다.|restorative
flowable-resin|플로어블 레진|Flowable Resin|재료|흐름성이 좋은 레진으로 작은 틈이나 바닥층에 사용합니다.|restorative
bulk-fill|벌크필 레진|Bulk-fill Resin|재료|벌크필 레진은 제품에서 정한 비교적 두꺼운 층으로 적용할 수 있도록 설계한 레진입니다.|restorative
resin-cement|레진 시멘트|Resin Cement|재료|접착력이 강한 보철용 접착제입니다. 지르코니아·세라믹 보철 접착에 사용합니다.|prosthodontics
gic-cement|GI 시멘트|Glass Ionomer Cement|재료|GI 시멘트는 글라스아이오노머 계열의 합착 등 용도에 사용하는 재료입니다.|prosthodontics
bone-substitute|골이식재|Bone Substitute|재료|뼈이식에 사용하는 재료입니다. 자가골·동종골(사람)·이종골(소·돼지)·합성골이 있으며 상황에 따라 선택합니다.|implant
collagen-membrane|콜라겐 차단막|Collagen Membrane|재료|뼈이식 부위에 덮어 잇몸 세포가 들어오는 것을 막고 뼈가 자라도록 돕는 막입니다. 시간이 지나면 흡수됩니다.|implant
prf|PRF(혈소판 풍부 섬유소)|Platelet-rich Fibrin|재료|PRF는 환자 혈액을 처리해 얻는 혈소판·섬유소 성분의 농축물을 말합니다.|implant,oral-surgery
lithium-disilicate|리튬 디실리케이트|Lithium Disilicate|재료|투명감이 좋은 유리 세라믹으로 앞니 크라운·라미네이트에 사용합니다.|prosthodontics
hybrid-ceramic|하이브리드 세라믹|Hybrid Ceramic|재료|하이브리드 세라믹은 세라믹·수지 성분을 결합한 여러 재료를 가리키는 표현입니다.|restorative
pmma|PMMA(임시 보철 재료)|PMMA|재료|임시 크라운·틀니 베이스에 쓰이는 아크릴 수지입니다.|prosthodontics
eugenol|유지놀|Eugenol|재료|유지놀은 일부 임시 치과 재료 등에 사용하는 성분입니다.|endodontics
one-fil|One-Fil(원필) MTA|One-Fil|재료|One-Fil은 치과용 칼슘 실리케이트 계열 재료의 제품명으로 실제 성분·허가 용도·사용 지침을 확인해 적용합니다.|vpt-crown,endodontics
hypertension-dental|고혈압과 치과 치료|Hypertension and Dental Care|전신질환·약물|혈압이 조절되면 대부분 치료가 가능합니다. 치료 전 혈압을 측정하고 약은 평소대로 복용하세요.|oral-surgery,implant
diabetes-dental|당뇨와 치과 치료|Diabetes and Dental Care|전신질환·약물|혈당이 조절되면 임플란트·발치가 가능하지만 상처 회복이 느릴 수 있습니다. 치료 전 식사·약 복용을 평소대로 하세요.|implant,periodontal
osteoporosis-dental|골다공증과 치과 치료|Osteoporosis and Dental Care|전신질환·약물|골다공증 자체와 치료 약물이 치과 계획에 미치는 영향을 구분합니다.|implant,oral-surgery
heart-disease-dental|심장질환과 치과 치료|Heart Disease and Dental Care|전신질환·약물|심장질환 환자는 정확한 진단·수술과 기구 삽입 이력, 증상 안정성과 항혈전 약물을 알립니다.|oral-surgery
cancer-treatment-dental|항암·방사선 치료와 구강|Cancer Therapy and Oral Health|전신질환·약물|항암·두경부 방사선 치료 전 구강 검진과 치료를 마치는 것이 권장됩니다. 치료 중 구내염·구강건조가 심해질 수 있습니다.|preventive
medication-history|복용 약물 확인|Medication History|전신질환·약물|치과 치료 전 복용 중인 모든 약(혈압약·항응고제·골다공증약·당뇨약 등)을 알려주세요. 안전한 치료 계획의 기본입니다.|oral-surgery
allergy-dental|치과 재료 알레르기|Dental Material Allergy|전신질환·약물|금속·라텍스·마취제 등에 대한 알레르기입니다. 과거 반응이 있었다면 반드시 미리 알려주세요.|restorative
toothache|치통|Toothache|증상|치아 또는 주변 조직의 통증입니다. 찬 것에 짧게 시리면 초기, 가만히 있어도 아프거나 밤에 심하면 신경까지 진행된 신호입니다.|endodontics,restorative
spontaneous-pain|자발통|Spontaneous Pain|증상|자극 없이도 저절로 아픈 통증입니다. 비가역성 치수염의 대표 증상으로 신경치료가 필요할 가능성이 높습니다.|endodontics
night-pain|야간통|Nocturnal Pain|증상|야간통은 밤에 통증이 심해지거나 잠을 깨우는 양상을 말합니다.|endodontics
biting-pain|씹을 때 통증|Pain on Biting|증상|음식을 씹을 때 찌릿한 통증입니다. 크랙·뿌리 끝 염증·높은 보철물이 원인일 수 있습니다.|restorative,endodontics
swelling|잇몸 부종|Gum Swelling|증상|잇몸이 부풀어 오르는 증상입니다. 치주 농양·치근단 농양·사랑니 염증이 원인이며 얼굴까지 부으면 즉시 내원하세요.|periodontal,endodontics,wisdom-tooth
bad-taste|입안 쓴맛·고름 맛|Bad Taste|증상|쓴맛이나 고름 같은 맛은 구강 감염, 구강건조·약물이나 미각 변화 등과 관련될 수 있습니다.|periodontal,endodontics
tooth-discoloration|치아 변색|Tooth Discoloration|증상|치아 변색은 표면 착색과 치아 내부 변화로 나눠 봅니다.|whitening,endodontics
loose-tooth|흔들리는 치아|Loose Tooth|증상|흔들리는 치아는 유치의 정상 교환인지 영구치의 지지 문제·외상인지 먼저 구분합니다.|periodontal
food-impaction|음식물 끼임|Food Impaction|증상|특정 치아 사이에 음식이 계속 끼는 증상입니다. 충치·접촉점 소실·잇몸 퇴축이 원인이며 방치하면 잇몸 염증이 생깁니다.|restorative,periodontal
jaw-pain|턱 통증|Jaw Pain|증상|턱 통증은 씹는 근육·턱관절·치아·감염 등 다양한 원인을 구분해야 합니다.|tmj
headache-dental|치과적 두통|Dental Headache|증상|치과적 두통이라는 표현은 턱관절이나 씹는 근육의 문제가 머리 통증과 연결되는 상황을 가리킵니다.|tmj
ear-pain-dental|귀 통증(치과 원인)|Referred Ear Pain|증상|턱관절 장애나 아래 어금니 염증이 귀 통증처럼 느껴지는 연관통입니다.|tmj,endodontics
chipped-tooth|치아 파절(깨짐)|Chipped Tooth|증상|치아가 깨지면 크기뿐 아니라 치수 노출·균열·뿌리 손상과 흔들림을 확인합니다.|restorative,vpt-crown
white-spot|백색 반점|White Spot Lesion|증상|법랑질 표면의 흰 얼룩입니다. 초기 충치(탈회)나 불소증이 원인이며 불소·레진 침투로 개선합니다.|preventive,restorative
health-insurance-dental|치과 건강보험|Dental Health Insurance|보험·제도|치과 건강보험은 질환·연령·치아·술식과 재료 등 급여 기준에 따라 적용됩니다.|preventive
non-covered|비급여 진료|Non-covered Services|보험·제도|비급여는 건강보험 급여 대상에 포함되지 않는 진료비 항목을 말합니다.|prosthodontics,implant
copayment|본인부담금|Copayment|보험·제도|보험 적용 진료비 중 환자가 내는 금액입니다. 치과 의원은 보통 30%입니다.|preventive
scaling-insurance|스케일링 건강보험|Scaling Insurance|보험·제도|만 19세 이상은 연 1회(매년 1월 1일 기준) 스케일링에 건강보험이 적용됩니다.|periodontal,preventive
denture-insurance|틀니 건강보험|Denture Insurance|보험·제도|노인 틀니 급여는 대상 연령·틀니 종류·등록과 재제작 주기 등 조건을 확인합니다.|prosthodontics
resin-insurance-child|어린이 레진 건강보험|Child Resin Insurance|보험·제도|어린이 레진 급여는 대상 연령과 영구치의 우식 치료 등 세부 기준을 확인해야 합니다.|pediatric,restorative
sealant-insurance|실란트 건강보험|Sealant Insurance|보험·제도|치아홈메우기 급여는 연령·대상 영구 어금니와 우식 상태 등 조건을 확인합니다.|pediatric
dental-record|진료기록·영상 발급|Dental Records|보험·제도|본인 진료기록과 X-ray는 요청 시 발급받을 수 있습니다. 병원 이동 시 중복 촬영을 줄일 수 있습니다.|preventive
informed-consent|치료 동의서|Informed Consent|보험·제도|수술·임플란트 전 치료 내용·대안·위험을 설명받고 서명하는 절차입니다. 충분한 설명을 듣고 질문하실 권리가 있습니다.|implant,oral-surgery
treatment-plan|치료 계획|Treatment Plan|보험·제도|치료 계획은 검사 결과를 바탕으로 보존·통증과 감염 조절·기능 회복의 순서를 정하는 자료입니다.|preventive
second-opinion|세컨드 오피니언|Second Opinion|보험·제도|다른 의료진의 의견은 큰 치료나 되돌리기 어려운 처치의 근거·대안을 이해하는 데 도움을 줄 수 있습니다.|preventive
`
