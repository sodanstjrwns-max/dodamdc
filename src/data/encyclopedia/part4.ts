// 마취·통증 / 감염관리 / 영상·장비 / 재료 / 전신질환 / 증상 / 보험제도
export const part4 = `
local-anesthesia|국소 마취|Local Anesthesia|마취·통증관리|치료 부위 신경만 일시적으로 마비시켜 통증을 없애는 마취입니다. 의식은 그대로 유지되며 2~3시간 후 풀립니다.|restorative,endodontics,oral-surgery
infiltration-anesthesia|침윤 마취|Infiltration Anesthesia|마취·통증관리|치료할 치아 근처 잇몸에 약을 넣어 그 부위만 마취하는 가장 흔한 방법입니다.|restorative
block-anesthesia|전달 마취|Nerve Block Anesthesia|마취·통증관리|신경 줄기에 마취해 아래턱 한쪽 전체를 마비시키는 방법입니다. 아래 어금니·사랑니 치료에 사용되며 입술까지 얼얼해집니다.|wisdom-tooth,endodontics
intraosseous-anesthesia|골내 마취|Intraosseous Anesthesia|마취·통증관리|치아 주변 뼛속에 직접 마취약을 넣어 그 치아만 즉시 마취하는 방법입니다. 입술이 얼얼하지 않고 효과가 빨라 도담치과는 퀵슬리퍼·데놉스 장비로 시행합니다.|vpt-crown,endodontics,periodontal
quicksleeper|퀵슬리퍼|QuickSleeper|영상·진단장비|전동 회전 방식으로 뼛속에 마취하는 골내 마취 장비입니다. 통증이 적고 마취 실패가 적어 신경치료·잇몸치료에 활용됩니다.|vpt-crown,endodontics
denops|데놉스(DENOPS)|DENOPS|영상·진단장비|휴대형 골내 마취 장비입니다. 마취가 잘 안 되는 급성 치수염 치아에도 즉각적인 마취를 돕습니다.|endodontics
topical-anesthesia|표면(도포) 마취|Topical Anesthesia|마취·통증관리|주사 전 잇몸에 바르는 젤 형태의 마취제입니다. 바늘이 들어갈 때의 따끔함을 줄여줍니다.|pediatric,restorative
computer-controlled-anesthesia|컴퓨터 제어 마취|Computer-controlled Anesthesia|마취·통증관리|마취약이 일정한 속도로 천천히 들어가도록 컴퓨터가 제어하는 방식입니다. 압력에 의한 통증이 크게 줄어 도담치과는 아이젭트(I-JECT) 장비를 사용합니다.|pediatric,restorative
iject|아이젭트(I-JECT)|I-JECT|영상·진단장비|무통 마취를 위한 컴퓨터 제어 전동 마취 장비입니다. 약제를 일정 속도로 주입하고 주사 소리를 줄여 어린이와 공포가 큰 환자에게 도움이 됩니다.|pediatric,restorative
anesthetic-warmer|마취액 워머|Anesthetic Warmer|영상·진단장비|마취약을 체온과 비슷하게 데워주는 장치입니다. 차가운 약제가 들어갈 때의 통증을 줄여 도담치과 모든 진료실에서 사용합니다.|restorative,endodontics
lidocaine|리도카인|Lidocaine|재료|치과에서 가장 널리 쓰이는 국소 마취제입니다. 효과가 빠르고 안전하며 에피네프린을 섞어 지속 시간을 늘립니다.|restorative
articaine|아티카인|Articaine|재료|뼈 투과력이 좋아 침윤 마취 효과가 뛰어난 마취제입니다. 위턱 어금니나 마취가 잘 안 되는 부위에 사용합니다.|endodontics
epinephrine|에피네프린|Epinephrine|재료|마취약에 섞는 혈관 수축제로 마취 시간을 늘리고 출혈을 줄입니다. 심장 질환이 있으면 미리 알려주셔야 합니다.|oral-surgery
anesthesia-duration|마취 지속 시간|Anesthesia Duration|마취·통증관리|보통 1~3시간이며 전달 마취는 더 오래갑니다. 풀리기 전에는 입술·혀를 씹지 않도록 식사를 피하세요.|restorative
dental-anxiety|치과 공포증|Dental Anxiety|마취·통증관리|치과 치료에 대한 두려움입니다. 도담치과는 치료 전 충분한 설명, 무통 마취 장비, 중간 휴식으로 공포를 줄이고 있습니다.|pediatric,restorative
pain-control|통증 조절|Pain Management|마취·통증관리|치료 중 마취와 치료 후 진통제·냉찜질로 통증을 관리하는 것입니다. 치료 후 통증은 대부분 2~3일 내 줄어듭니다.|oral-surgery,endodontics
nsaid|소염진통제|NSAIDs|전신질환·약물|이부프로펜 등 염증과 통증을 함께 줄이는 약입니다. 치과 통증에 가장 효과적이며 위장 장애가 있으면 식후 복용합니다.|oral-surgery
acetaminophen|아세트아미노펜|Acetaminophen|전신질환·약물|타이레놀 계열 진통제입니다. 위장에 부담이 적고 임산부도 사용 가능하지만 염증 억제 효과는 적습니다.|oral-surgery
premedication|예방적 항생제|Antibiotic Prophylaxis|전신질환·약물|심장 판막 질환·인공관절 등 감염 위험이 높은 분이 치과 치료 전 미리 복용하는 항생제입니다.|oral-surgery,implant
infection-control|감염관리|Infection Control|감염관리·소독|환자 간 교차 감염을 막기 위한 소독·멸균·일회용품 사용 체계입니다. 도담치과는 환자별 기구 멸균 포장을 원칙으로 합니다.|preventive
sterilization|멸균|Sterilization|감염관리·소독|모든 미생물과 포자를 완전히 제거하는 과정입니다. 고압증기(오토클레이브)·플라즈마 멸균이 대표적입니다.|preventive
disinfection|소독|Disinfection|감염관리·소독|병원성 미생물 대부분을 제거하는 과정으로 멸균보다 낮은 단계입니다. 표면·체어·손잡이에 적용합니다.|preventive
autoclave|고압증기멸균기(오토클레이브)|Autoclave|감염관리·소독|고온·고압 증기로 기구를 멸균하는 장비입니다. 도담치과는 B클래스 진공 오토클레이브(48L)를 사용해 속이 빈 기구까지 멸균합니다.|preventive
class-b-autoclave|B클래스 멸균기|Class B Autoclave|감염관리·소독|진공으로 공기를 완전히 빼내 포장된 기구·핸드피스 내부까지 멸균하는 최고 등급 멸균기입니다.|preventive
plasma-sterilizer|플라즈마 멸균기|Plasma Sterilizer|감염관리·소독|저온 플라즈마로 열에 약한 기구를 멸균하는 장비입니다. 도담치과는 EXPLASMA 장비로 핸드피스·정밀 기구를 멸균합니다.|preventive
sterilization-pouch|멸균 파우치|Sterilization Pouch|감염관리·소독|기구를 넣어 멸균한 뒤 사용 직전까지 봉인 상태를 유지하는 포장입니다. 색이 변하는 표시로 멸균 여부를 확인합니다.|preventive
handpiece-sterilization|핸드피스 멸균|Handpiece Sterilization|감염관리·소독|치아를 깎는 드릴(핸드피스)을 환자마다 교체·멸균하는 것입니다. 내부에 침·혈액이 역류할 수 있어 매 환자 멸균이 필수입니다.|preventive
disposable|일회용품|Disposables|감염관리·소독|장갑·마스크·컵·석션팁·주사침 등 한 번 쓰고 버리는 용품입니다. 교차 감염 예방의 기본입니다.|preventive
surface-barrier|표면 보호 커버|Surface Barrier|감염관리·소독|체어·라이트 손잡이·키보드 등 자주 만지는 표면을 덮는 일회용 필름입니다.|preventive
waterline|치과 수관 관리|Dental Unit Waterline|감염관리·소독|치과 체어에서 나오는 물이 지나는 관을 소독·관리하는 것입니다. 정기 소독으로 세균막 형성을 막습니다.|preventive
aerosol|에어로졸|Aerosol|감염관리·소독|치료 중 물과 함께 공기 중으로 퍼지는 미세 물방울입니다. 강한 석션과 환기로 확산을 줄입니다.|preventive
high-volume-suction|고속 흡입기|High-volume Evacuation|감염관리·소독|치료 중 물·침·에어로졸을 빠르게 빨아들이는 장치입니다.|preventive
hand-hygiene|손 위생|Hand Hygiene|감염관리·소독|환자 접촉 전후 손 씻기와 장갑 교체입니다. 감염관리의 가장 기본 단계입니다.|preventive
radiation-dose|방사선 노출량|Radiation Dose|영상·진단장비|치과 X-ray는 매우 낮은 선량으로, 파노라마 한 장은 비행기 왕복 탑승 정도의 자연 방사선에 해당합니다. 도담치과는 저선량 CT를 사용합니다.|preventive
low-dose-ct|저선량 CT|Low-dose CT|영상·진단장비|일반 CT보다 방사선량을 크게 낮춘 촬영 방식입니다. 도담치과 Green16 CT는 저선량 모드로 임플란트·사랑니 진단에 활용됩니다.|implant,wisdom-tooth
digital-xray|디지털 X-ray|Digital Radiography|영상·진단장비|필름 대신 디지털 센서로 촬영해 방사선량이 적고 즉시 확인할 수 있는 방식입니다.|preventive
intraoral-sensor|구내 센서|Intraoral Sensor|영상·진단장비|입안에 넣어 치아 1~3개를 정밀하게 촬영하는 디지털 센서입니다. 충치·뿌리 끝 병소 확인에 사용합니다.|restorative,endodontics
periapical-xray|치근단 X-ray|Periapical Radiograph|영상·진단장비|치아 하나하나의 뿌리 끝까지 보이는 정밀 사진입니다. 신경치료와 충치 진단의 기본입니다.|endodontics,restorative
bitewing|교익 X-ray|Bitewing Radiograph|영상·진단장비|위아래 치아 사이 충치와 뼈 높이를 함께 보는 촬영입니다. 치간 충치 발견에 가장 유용합니다.|restorative,periodontal
portable-xray|포터블 X-ray|Portable X-ray|영상·진단장비|진료실에서 바로 촬영할 수 있는 이동형 X-ray 장비입니다. 신경치료 중 이동 없이 확인이 가능합니다.|endodontics
intraoral-camera|구강 카메라|Intraoral Camera|영상·진단장비|입안을 확대 촬영해 모니터로 보여주는 카메라입니다. 환자가 본인의 치아 상태를 직접 확인하며 설명을 들을 수 있습니다.|preventive
led-light|LED 무영등|LED Operating Light|영상·진단장비|그림자가 생기지 않도록 설계된 진료용 조명입니다. 정확한 색상 확인을 위해 색온도가 관리됩니다.|restorative
dental-unit|유니트 체어|Dental Unit Chair|영상·진단장비|치과 진료용 의자와 기구가 통합된 장비입니다. 도담치과는 개인 진료실 형태로 배치되어 있습니다.|preventive
handpiece|핸드피스|Dental Handpiece|영상·진단장비|치아를 깎거나 다듬는 회전 기구입니다. 도담치과는 KaVo 핸드피스를 환자별로 멸균해 사용합니다.|restorative
ultrasonic-scaler|초음파 스케일러|Ultrasonic Scaler|영상·진단장비|초음파 진동과 물로 치석을 떼어내는 장비입니다. 도담치과는 따뜻한 물이 나오는 시스템으로 시림을 줄입니다.|periodontal
warm-water-scaling|온수 스케일링|Warm Water Scaling|치주(잇몸)|스케일링 중 나오는 물을 체온에 가깝게 데워 시린 느낌을 줄이는 방식입니다. 잇몸이 예민한 분도 편하게 받을 수 있습니다.|periodontal,preventive
piezo|피에조 장비|Piezoelectric Device|영상·진단장비|미세 초음파 진동으로 뼈만 선택적으로 자르는 수술 장비입니다. 연조직·신경 손상을 줄입니다.|implant,oral-surgery
laser-dentistry|치과 레이저|Dental Laser|영상·진단장비|연조직 절개·소독·통증 완화에 사용하는 레이저입니다. 출혈이 적고 회복이 빠릅니다.|periodontal
composite-material|복합레진 재료|Composite Material|재료|레진 기질과 필러 입자로 구성된 치아색 충전재입니다. 필러 크기에 따라 강도와 광택이 달라집니다.|restorative
flowable-resin|플로어블 레진|Flowable Resin|재료|흐름성이 좋은 레진으로 작은 틈이나 바닥층에 사용합니다.|restorative
bulk-fill|벌크필 레진|Bulk-fill Resin|재료|한 번에 두껍게 채워도 굳는 레진으로 치료 시간을 줄입니다.|restorative
resin-cement|레진 시멘트|Resin Cement|재료|접착력이 강한 보철용 접착제입니다. 지르코니아·세라믹 보철 접착에 사용합니다.|prosthodontics
gic-cement|GI 시멘트|Glass Ionomer Cement|재료|불소를 방출하는 접착제로 금속 크라운 접착이나 임시 충전에 사용합니다.|prosthodontics
bone-substitute|골이식재|Bone Substitute|재료|뼈이식에 사용하는 재료입니다. 자가골·동종골(사람)·이종골(소·돼지)·합성골이 있으며 상황에 따라 선택합니다.|implant
collagen-membrane|콜라겐 차단막|Collagen Membrane|재료|뼈이식 부위에 덮어 잇몸 세포가 들어오는 것을 막고 뼈가 자라도록 돕는 막입니다. 시간이 지나면 흡수됩니다.|implant
prf|PRF(혈소판 풍부 섬유소)|Platelet-rich Fibrin|재료|환자 본인의 피를 원심분리해 만든 치유 촉진 물질입니다. 발치·임플란트 부위 회복을 돕습니다.|implant,oral-surgery
lithium-disilicate|리튬 디실리케이트|Lithium Disilicate|재료|투명감이 좋은 유리 세라믹으로 앞니 크라운·라미네이트에 사용합니다.|prosthodontics
hybrid-ceramic|하이브리드 세라믹|Hybrid Ceramic|재료|세라믹과 레진의 장점을 합친 재료입니다. 인레이·임시 보철에 사용합니다.|restorative
pmma|PMMA(임시 보철 재료)|PMMA|재료|임시 크라운·틀니 베이스에 쓰이는 아크릴 수지입니다.|prosthodontics
eugenol|유지놀|Eugenol|재료|정향유 성분으로 진정 효과가 있어 임시 충전재와 발치 후 드레싱에 사용합니다.|endodontics
one-fil|One-Fil(원필) MTA|One-Fil|재료|주입형으로 사용이 편한 바이오세라믹 MTA 계열 재료입니다. 도담치과는 치수보존·근관 밀봉에 One-Fil을 사용합니다.|vpt-crown,endodontics
hypertension-dental|고혈압과 치과 치료|Hypertension and Dental Care|전신질환·약물|혈압이 조절되면 대부분 치료가 가능합니다. 치료 전 혈압을 측정하고 약은 평소대로 복용하세요.|oral-surgery,implant
diabetes-dental|당뇨와 치과 치료|Diabetes and Dental Care|전신질환·약물|혈당이 조절되면 임플란트·발치가 가능하지만 상처 회복이 느릴 수 있습니다. 치료 전 식사·약 복용을 평소대로 하세요.|implant,periodontal
osteoporosis-dental|골다공증과 치과 치료|Osteoporosis and Dental Care|전신질환·약물|골다공증 자체는 문제가 아니지만 치료 약물(비스포스포네이트)이 턱뼈 치유에 영향을 줄 수 있어 복용 약을 반드시 알려주세요.|implant,oral-surgery
heart-disease-dental|심장질환과 치과 치료|Heart Disease and Dental Care|전신질환·약물|판막 질환·스텐트·항응고제 복용 여부에 따라 예방적 항생제나 지혈 계획이 필요합니다. 주치의와 협진합니다.|oral-surgery
cancer-treatment-dental|항암·방사선 치료와 구강|Cancer Therapy and Oral Health|전신질환·약물|항암·두경부 방사선 치료 전 구강 검진과 치료를 마치는 것이 권장됩니다. 치료 중 구내염·구강건조가 심해질 수 있습니다.|preventive
medication-history|복용 약물 확인|Medication History|전신질환·약물|치과 치료 전 복용 중인 모든 약(혈압약·항응고제·골다공증약·당뇨약 등)을 알려주세요. 안전한 치료 계획의 기본입니다.|oral-surgery
allergy-dental|치과 재료 알레르기|Dental Material Allergy|전신질환·약물|금속·라텍스·마취제 등에 대한 알레르기입니다. 과거 반응이 있었다면 반드시 미리 알려주세요.|restorative
toothache|치통|Toothache|증상|치아 또는 주변 조직의 통증입니다. 찬 것에 짧게 시리면 초기, 가만히 있어도 아프거나 밤에 심하면 신경까지 진행된 신호입니다.|endodontics,restorative
spontaneous-pain|자발통|Spontaneous Pain|증상|자극 없이도 저절로 아픈 통증입니다. 비가역성 치수염의 대표 증상으로 신경치료가 필요할 가능성이 높습니다.|endodontics
night-pain|야간통|Nocturnal Pain|증상|누우면 심해지는 치통입니다. 머리 쪽 혈류가 늘어 치수 압력이 높아지기 때문이며 치수염 진행 신호입니다.|endodontics
biting-pain|씹을 때 통증|Pain on Biting|증상|음식을 씹을 때 찌릿한 통증입니다. 크랙·뿌리 끝 염증·높은 보철물이 원인일 수 있습니다.|restorative,endodontics
swelling|잇몸 부종|Gum Swelling|증상|잇몸이 부풀어 오르는 증상입니다. 치주 농양·치근단 농양·사랑니 염증이 원인이며 얼굴까지 부으면 즉시 내원하세요.|periodontal,endodontics,wisdom-tooth
bad-taste|입안 쓴맛·고름 맛|Bad Taste|증상|고름이 새어 나올 때 느껴지는 불쾌한 맛입니다. 누공이나 치주 농양 신호일 수 있습니다.|periodontal,endodontics
tooth-discoloration|치아 변색|Tooth Discoloration|증상|치아 색이 어두워지는 증상입니다. 한 개만 어둡다면 신경 괴사, 전체적이면 착색·노화가 원인입니다.|whitening,endodontics
loose-tooth|흔들리는 치아|Loose Tooth|증상|성인 치아가 흔들리는 것은 치주염으로 뼈가 녹았거나 외상·과부하가 원인입니다. 조기 치료로 보존 가능성이 높아집니다.|periodontal
food-impaction|음식물 끼임|Food Impaction|증상|특정 치아 사이에 음식이 계속 끼는 증상입니다. 충치·접촉점 소실·잇몸 퇴축이 원인이며 방치하면 잇몸 염증이 생깁니다.|restorative,periodontal
jaw-pain|턱 통증|Jaw Pain|증상|턱관절이나 주변 근육의 통증입니다. 아침에 심하면 이갈이, 씹을 때 심하면 관절 문제를 의심합니다.|tmj
headache-dental|치과적 두통|Dental Headache|증상|이갈이·이악물기·교합 이상으로 생기는 두통입니다. 관자놀이 통증이 특징이며 스플린트로 호전될 수 있습니다.|tmj
ear-pain-dental|귀 통증(치과 원인)|Referred Ear Pain|증상|턱관절 장애나 아래 어금니 염증이 귀 통증처럼 느껴지는 연관통입니다.|tmj,endodontics
chipped-tooth|치아 파절(깨짐)|Chipped Tooth|증상|치아 일부가 깨진 상태입니다. 작으면 레진, 크면 크라운, 신경까지 노출되면 신경치료 또는 VPT가 필요합니다.|restorative,vpt-crown
white-spot|백색 반점|White Spot Lesion|증상|법랑질 표면의 흰 얼룩입니다. 초기 충치(탈회)나 불소증이 원인이며 불소·레진 침투로 개선합니다.|preventive,restorative
health-insurance-dental|치과 건강보험|Dental Health Insurance|보험·제도|충치 치료(아말감·GI), 신경치료, 발치, 스케일링(연 1회), 잇몸치료, 65세 이상 틀니·임플란트 등이 보험 적용됩니다. 레진·세라믹·지르코니아는 비급여입니다.|preventive
non-covered|비급여 진료|Non-covered Services|보험·제도|건강보험이 적용되지 않아 전액 본인 부담인 진료입니다. 임플란트(65세 미만)·지르코니아·인레이·미백 등이 해당하며 도담치과는 비급여 항목을 홈페이지에 고지합니다.|prosthodontics,implant
copayment|본인부담금|Copayment|보험·제도|보험 적용 진료비 중 환자가 내는 금액입니다. 치과 의원은 보통 30%입니다.|preventive
scaling-insurance|스케일링 건강보험|Scaling Insurance|보험·제도|만 19세 이상은 연 1회(매년 1월 1일 기준) 스케일링에 건강보험이 적용됩니다.|periodontal,preventive
denture-insurance|틀니 건강보험|Denture Insurance|보험·제도|만 65세 이상은 7년마다 1회 완전틀니·부분틀니에 건강보험(본인부담 30%)이 적용됩니다.|prosthodontics
resin-insurance-child|어린이 레진 건강보험|Child Resin Insurance|보험·제도|만 12세 이하 영구치 충치 레진 치료는 건강보험이 적용됩니다.|pediatric,restorative
sealant-insurance|실란트 건강보험|Sealant Insurance|보험·제도|만 18세 이하 첫째·둘째 큰어금니 실란트는 건강보험 적용(본인부담 10%)입니다.|pediatric
dental-record|진료기록·영상 발급|Dental Records|보험·제도|본인 진료기록과 X-ray는 요청 시 발급받을 수 있습니다. 병원 이동 시 중복 촬영을 줄일 수 있습니다.|preventive
informed-consent|치료 동의서|Informed Consent|보험·제도|수술·임플란트 전 치료 내용·대안·위험을 설명받고 서명하는 절차입니다. 충분한 설명을 듣고 질문하실 권리가 있습니다.|implant,oral-surgery
treatment-plan|치료 계획|Treatment Plan|보험·제도|검진 결과를 바탕으로 우선순위·기간·비용을 정리한 계획입니다. 도담치과는 최소 침습 원칙으로 여러 선택지를 함께 설명합니다.|preventive
second-opinion|세컨드 오피니언|Second Opinion|보험·제도|다른 치과의사의 의견을 듣는 것입니다. 큰 치료 전 권장되며 도담치과는 타원 진단에 대한 상담도 환영합니다.|preventive
`
