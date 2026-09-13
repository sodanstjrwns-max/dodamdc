// 진료 과정·생활 관리·기타
export const part5 = `
dental-checkup-process|치과 검진 과정|Dental Examination Process|예방·관리|치과 검진은 주 증상·병력 확인과 구강검사 뒤 필요한 치주·영상 검사 등을 선택하는 과정입니다.|preventive
chief-complaint|주 증상(주소)|Chief Complaint|예방·관리|환자가 치과를 찾은 가장 주된 불편입니다. 진료는 이 문제를 먼저 해결하는 것에서 시작합니다.|preventive
medical-history|병력 조사|Medical History|예방·관리|전신 질환·복용 약·알레르기·과거 치료 경험을 확인하는 과정입니다. 안전한 치료를 위해 정확히 알려주세요.|preventive
oral-examination|구강 검사|Oral Examination|예방·관리|구강검사는 치아·잇몸·점막과 보철, 필요시 턱 기능 등을 살피는 진찰입니다.|preventive
treatment-consent|설명 후 동의|Explanation and Consent|보험·제도|치료 내용·비용·기간·대안을 설명 듣고 동의하는 과정입니다. 궁금한 점은 언제든 질문하세요.|preventive
appointment|예약 진료|Appointment System|보험·제도|예약은 필요한 진료 시간을 확보하고 대기를 조정하기 위한 방식입니다.|preventive
night-clinic|야간 진료|Evening Clinic|보험·제도|야간진료는 평일 저녁에 운영하는 진료 시간대입니다.|preventive
emergency-dental|치과 응급 상황|Dental Emergency|증상|심한 통증·얼굴 부종·치아 탈구·출혈이 멈추지 않는 경우입니다. 진료 시간 내 즉시 연락하시면 우선 진료를 도와드립니다.|oral-surgery,endodontics
post-treatment-care|치료 후 관리|Post-treatment Care|예방·관리|치료 종류별 주의사항(식사·양치·약 복용)을 지키는 것입니다. 회복 속도와 결과를 좌우합니다.|preventive
recall|리콜(정기 관리 안내)|Recall System|예방·관리|리콜은 정기 관리와 재평가 시점을 안내하는 체계입니다.|preventive
oral-health-education|구강 보건 교육|Oral Health Education|예방·관리|구강 보건 교육은 본인의 병소와 생활 환경에 맞는 관리 방법을 익히는 과정입니다.|preventive
plaque-disclosing|치면 착색 검사|Plaque Disclosing|예방·관리|치태를 붉게 염색해 칫솔질이 부족한 부위를 눈으로 확인하는 검사입니다.|preventive,pediatric
caries-risk-assessment|충치 위험도 평가|Caries Risk Assessment|예방·관리|식습관·침 분비·과거 충치·불소 사용을 종합해 충치 위험을 평가하고 관리 주기를 정하는 것입니다.|preventive
oral-cancer-screening|구강암 검진|Oral Cancer Screening|예방·관리|구강암 관련 검진에서는 입술·혀·점막과 목 주변의 의심 변화를 살핍니다.|preventive
leukoplakia|백반증|Leukoplakia|증상|백반증은 다른 원인으로 설명되지 않는 지속적인 흰 병변에 사용되는 임상 용어입니다.|oral-surgery
oral-thrush|구강 칸디다증|Oral Candidiasis|증상|구강 칸디다증은 진균과 관련한 구강 감염으로 흰 막이나 붉고 따가운 부위 등 다양한 모습이 가능합니다.|prosthodontics
herpes-labialis|입술 헤르페스|Herpes Labialis|증상|입술 헤르페스는 따끔거림 뒤 물집 등이 반복될 수 있는 바이러스 관련 질환입니다.|preventive
geographic-tongue|지도상 설|Geographic Tongue|증상|혀 표면에 지도 모양의 붉은 반점이 생기는 양성 상태입니다. 치료가 필요하지 않은 경우가 많습니다.|preventive
burning-mouth|구강 작열감 증후군|Burning Mouth Syndrome|증상|구강 작열감은 혀나 입안이 화끈거리는 증상입니다.|preventive
taste-disorder|미각 이상|Taste Disorder|증상|맛을 못 느끼거나 이상하게 느끼는 증상입니다. 약물·구강건조·아연 결핍 등이 원인일 수 있습니다.|preventive
tooth-wear|치아 마모|Tooth Wear|증상|치아가 닳아 없어지는 현상의 총칭입니다. 교모(치아끼리)·마모(외부 물질)·침식(산)이 있으며 원인에 따라 관리가 다릅니다.|restorative,tmj
diastema|치아 사이 틈(치간이개)|Diastema|증상|앞니 사이가 벌어진 상태입니다. 레진·바이오클리어로 삭제 없이 메울 수 있습니다.|restorative
gummy-smile|거미 스마일|Gummy Smile|증상|웃을 때 잇몸이 많이 보이는 상태입니다. 원인에 따라 잇몸 성형 등으로 개선 가능합니다.|periodontal
tooth-shape|치아 형태 이상|Tooth Shape Anomaly|증상|왜소치·융합치 등 형태가 다른 치아입니다. 심미·기능 문제가 있으면 레진이나 보철로 개선합니다.|restorative,prosthodontics
enamel-hypoplasia|법랑질 형성부전|Enamel Hypoplasia|증상|법랑질 형성부전은 치아가 만들어질 때 법랑질 양이 충분하지 않아 홈·얇은 부위 등이 생긴 상태입니다.|pediatric,restorative
mih|MIH(어금니 앞니 저광화)|Molar Incisor Hypomineralization|소아치과|MIH는 주로 첫 영구 큰어금니와 때로 앞니에 나타나는 경계가 있는 저광화 결함입니다.|pediatric
bottle-caries|우유병 우식|Baby Bottle Caries|소아치과|우유병 우식은 유아기 우식 위험을 설명하는 과거 표현으로, 장시간·반복적인 당 노출과 구강 관리 등을 살펴야 합니다.|pediatric
child-behavior-management|소아 행동 조절|Pediatric Behavior Management|소아치과|소아 행동 조절은 아이의 발달·이전 경험·불안에 맞춰 진료 참여를 돕는 과정입니다.|pediatric
tooth-fairy-eruption-chart|치아 교환 시기표|Tooth Eruption Chart|소아치과|유치가 빠지고 영구치가 나는 평균 시기를 정리한 표입니다. 아래 앞니 6~7세, 큰어금니 6세, 송곳니 9~12세가 대표적입니다.|pediatric
six-year-molar|6세 구치|First Permanent Molar|소아치과|만 6세 무렵 유치 뒤쪽에 새로 나는 첫 영구 큰어금니입니다. 유치로 오해해 방치되기 쉬워 실란트로 보호합니다.|pediatric,preventive
shark-teeth|이중 치열(샤크 투스)|Shark Teeth|소아치과|유치가 빠지지 않은 채 영구치가 안쪽에서 나오는 현상입니다. 대부분 자연 해결되나 유치가 오래 남으면 발치합니다.|pediatric
crown-fracture-child|어린이 치아 깨짐|Pediatric Crown Fracture|소아치과|어린이 치아 파절은 유치·영구치와 치근 성숙 정도를 먼저 구분합니다.|pediatric
tmj-in-teens|청소년 턱관절 장애|Adolescent TMD|턱관절|청소년 턱관절 문제는 성장·치아 교환과 생활·수면, 외상 이력을 함께 평가합니다.|tmj
posture-tmj|자세와 턱관절|Posture and TMJ|턱관절|자세와 목·턱의 불편은 함께 나타날 수 있어 작업 환경과 오래 유지하는 자세를 점검합니다.|tmj
stress-bruxism|스트레스와 이갈이|Stress and Bruxism|턱관절|스트레스는 일부 이악물기·턱 근육 활동과 관련될 수 있어 수면·일상 상황을 함께 살핍니다.|tmj
sleep-apnea-dental|수면무호흡과 치과|Sleep Apnea and Dentistry|턱관절|수면무호흡이 의심되면 코골이·목격된 호흡 중단·낮 졸림 등의 병력을 확인하고 수면 관련 진료를 통해 진단받습니다.|tmj
periodontal-30s|30대 잇몸 관리|Gum Care in Your 30s|치주(잇몸)|30대에도 잇몸 상태는 나이보다 치태, 흡연·당뇨와 과거 치주 이력의 영향을 받습니다.|periodontal
gum-recession-brushing|칫솔질과 잇몸 퇴축|Brushing and Recession|치주(잇몸)|세게 옆으로 닦는 습관은 잇몸을 내려가게 하고 치아를 마모시킵니다. 부드러운 칫솔로 가볍게 닦는 것이 중요합니다.|periodontal,preventive
periodontal-heart|치주염과 심혈관 질환|Periodontitis and Heart Disease|전신질환·약물|치주질환과 심혈관질환의 연관성이 연구되어 있지만 공통 위험 요인과 인과관계를 구분해야 합니다.|periodontal
periodontal-pregnancy|치주염과 임신|Periodontitis and Pregnancy|전신질환·약물|임신 중 호르몬 변화 등으로 잇몸의 염증 반응이 달라질 수 있어 청결과 검진이 중요합니다.|periodontal
implant-vs-bridge|임플란트 vs 브릿지|Implant vs Bridge|임플란트|임플란트는 뼈 속 지지를 만들고 브릿지는 주로 주변 치아 등을 지지대로 연결하는 방식입니다.|implant,prosthodontics
implant-vs-denture|임플란트 vs 틀니|Implant vs Denture|임플란트|임플란트 보철과 틀니는 지지 방식·탈착 여부·수술 필요성 및 관리가 다릅니다.|implant,prosthodontics
implant-timeline|임플란트 치료 기간|Implant Treatment Timeline|임플란트|임플란트 일정은 발치, 이식, 식립과 치유, 보철 단계에 따라 달라집니다.|implant
implant-pain|임플란트 수술 통증|Implant Surgery Discomfort|임플란트|수술 통증과 부기는 절개·이식 범위, 수술 시간과 개인의 반응에 따라 다릅니다.|implant
implant-food|임플란트 후 식사|Diet after Implant|임플란트|수술 뒤 식사는 상처 보호와 임플란트 하중 조절을 함께 고려합니다.|implant
implant-smoking|임플란트와 흡연|Implants and Smoking|임플란트|흡연은 골유착 실패와 임플란트 주위염 위험을 크게 높입니다. 최소 수술 전후 2주 금연을 권합니다.|implant
implant-age|임플란트 가능 나이|Implant Age Requirements|임플란트|임플란트 가능 여부는 나이 숫자만으로 정하지 않습니다.|implant
implant-warranty|임플란트 보증|Implant Warranty|보험·제도|임플란트의 보증·사후관리 조건은 기관별 계약·안내에 따라 다릅니다.|implant
vpt-vs-rct|치수보존치료 vs 신경치료|VPT vs Root Canal|신경치료|VPT는 남길 수 있는 생활 치수의 보존을 목표로 하고 근관치료는 손상·감염된 근관 내부를 처리합니다.|vpt-crown,endodontics
vpt-success|치수보존치료 성공률과 관리|VPT Prognosis|신경치료|치수보존치료의 경과는 증상뿐 아니라 치수 반응, 수복물 밀폐와 필요한 영상으로 평가합니다.|vpt-crown
vpt-crown-why|VPT 후 크라운이 필요한 이유|Crown after VPT|신경치료|VPT 후 수복은 치수를 외부 오염에서 보호하고 남은 치아가 씹는 힘을 견디게 하는 목적입니다.|vpt-crown,prosthodontics
rct-visits|신경치료 횟수|Root Canal Visits|신경치료|보통 2~4회이며 감염 정도·근관 수에 따라 달라집니다. 중간에 아프지 않아도 마무리까지 꼭 오셔야 합니다.|endodontics
rct-pain-after|신경치료 후 통증|Post-endodontic Pain|신경치료|근관치료 후에는 뿌리 주변 조직 반응이나 맞물림 때문에 씹을 때 불편할 수 있습니다.|endodontics
rct-lifespan|신경치료 치아 수명|Longevity of Treated Teeth|신경치료|근관치료한 치아의 유지 기간은 초기 손상, 남은 치질, 뿌리와 잇몸 지지 및 최종 수복에 따라 달라집니다.|endodontics,prosthodontics
wisdom-when-to-extract|사랑니 발치 기준|When to Extract Wisdom Teeth|구강외과·사랑니|반복 염증, 옆 치아 충치·뿌리 손상, 물혹, 칫솔이 닿지 않는 위치일 때 권합니다. 똑바로 나서 잘 닦이면 유지합니다.|wisdom-tooth
wisdom-keep|사랑니를 유지하는 경우|Retaining Wisdom Teeth|구강외과·사랑니|사랑니가 기능하며 청소 가능하고 주변에 문제가 없다면 관찰하며 유지할 수 있습니다.|wisdom-tooth
wisdom-recovery|사랑니 발치 후 회복|Recovery after Wisdom Tooth Removal|구강외과·사랑니|사랑니 회복은 매복 깊이·절개·뼈 제거와 개인 반응에 따라 다릅니다.|wisdom-tooth
wisdom-ct|사랑니 CT 촬영|CT for Wisdom Teeth|구강외과·사랑니|사랑니 CT는 2차원 영상으로 해결하기 어려운 신경관·치근 등 위치 관계를 확인할 때 검토합니다.|wisdom-tooth
wisdom-upper-lower|위·아래 사랑니 차이|Upper vs Lower Wisdom Teeth|구강외과·사랑니|위 사랑니는 상악동 등과, 아래 사랑니는 하치조신경관 등과의 관계를 살핍니다.|wisdom-tooth
scaling-frequency|스케일링 주기|Scaling Frequency|치주(잇몸)|스케일링과 유지 방문의 간격은 치석 형성, 치주염 이력과 자가 관리 수준 등에 따라 정합니다.|periodontal,preventive
scaling-myth|스케일링 오해|Scaling Myths|치주(잇몸)|'스케일링하면 치아가 깎인다·벌어진다'는 오해입니다. 치석이 빠지며 생긴 공간이 드러나는 것으로 치아 손상은 없습니다.|periodontal
scaling-after|스케일링 후 시림|Post-scaling Sensitivity|치주(잇몸)|스케일링 후 시림은 염증·치석에 가려진 치근 노출 등이 관련될 수 있습니다.|periodontal
gum-treatment-stages|잇몸치료 단계|Stages of Gum Treatment|치주(잇몸)|스케일링 → 치근활택술·소파술 → (필요 시) 잇몸 수술 → 유지 관리 순입니다. 단계별로 재평가하며 진행합니다.|periodontal
gum-treatment-insurance|잇몸치료 건강보험|Gum Treatment Insurance|보험·제도|치근활택술·치주소파술·치은박리소파술은 건강보험이 적용됩니다.|periodontal
crown-material-choice|크라운 재료 선택|Choosing Crown Material|보철(크라운·틀니)|크라운 재료는 치아 위치·남은 치질·하중과 색 요구, 삭제 공간·접착 조건을 고려해 선택합니다.|prosthodontics
crown-process|크라운 치료 과정|Crown Procedure|보철(크라운·틀니)|크라운 치료는 진단과 필요 처치, 삭제·기록, 임시 보철, 시적·접착 및 점검으로 이어집니다.|prosthodontics
crown-lifespan|크라운 수명|Crown Longevity|보철(크라운·틀니)|크라운은 경계 우식·치아 파절·잇몸 변화와 보철 손상 등을 점검하며 유지합니다.|prosthodontics
inlay-vs-crown|인레이 vs 크라운|Inlay vs Crown|보철(크라운·틀니)|인레이는 결손 안을 채우는 간접 수복이고 크라운은 치아를 둘러싸 덮는 보철입니다.|restorative,prosthodontics
resin-vs-inlay|레진 vs 인레이|Resin vs Inlay|충치·보존치료|레진은 입안에서 직접 형태를 만드는 경우가 많고 인레이는 밖에서 제작해 붙이는 간접 수복입니다.|restorative
resin-lifespan|레진 수명|Resin Longevity|충치·보존치료|위치·크기·관리에 따라 다르며 가장자리 착색이나 마모가 생기면 부분 수리도 가능합니다.|restorative
cavity-no-pain|아프지 않은 충치|Painless Caries|충치·보존치료|충치는 신경 근처까지 가기 전엔 대부분 통증이 없습니다. '안 아프니 괜찮다'가 가장 흔한 오해입니다.|restorative,preventive
cavity-progression|충치 진행 단계|Caries Progression|충치·보존치료|우식은 법랑질의 광물 소실에서 시작해 표면 결손과 상아질 손상으로 이어질 수 있습니다.|restorative,endodontics
whitening-safety|미백 안전성|Whitening Safety|미백|미백 전에는 우식·잇몸질환·노출 상아질과 보철, 약물·임신 등 상태를 확인합니다.|whitening
whitening-candidates|미백이 어려운 경우|Whitening Limitations|미백|미백 적합성은 변색 종류·기존 수복물과 치아·잇몸 건강을 기준으로 판단합니다.|whitening
kakao-consult|카카오톡 상담|Kakao Consultation|보험·제도|카카오톡 상담은 방문 준비와 간단한 문의·일정 확인에 활용할 수 있습니다.|preventive
first-visit-guide|첫 방문 안내|First Visit Guide|보험·제도|처음 방문할 때는 본인 확인 자료와 약 목록, 과거 진료·영상이 있다면 준비합니다.|preventive
dental-photos-record|구강 사진 기록|Clinical Photography|예방·관리|구강 사진 기록은 치아·점막·보철의 외형과 변화, 치료 목표를 공유하는 자료입니다.|preventive
`
