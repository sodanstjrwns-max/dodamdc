// 진료 과정·생활 관리·기타
export const part5 = `
dental-checkup-process|치과 검진 과정|Dental Examination Process|예방·관리|문진 → 구강 검사 → X-ray/큐레이 촬영 → 결과 설명 → 치료 계획 순으로 진행됩니다. 도담치과는 사진과 영상을 함께 보며 설명합니다.|preventive
chief-complaint|주 증상(주소)|Chief Complaint|예방·관리|환자가 치과를 찾은 가장 주된 불편입니다. 진료는 이 문제를 먼저 해결하는 것에서 시작합니다.|preventive
medical-history|병력 조사|Medical History|예방·관리|전신 질환·복용 약·알레르기·과거 치료 경험을 확인하는 과정입니다. 안전한 치료를 위해 정확히 알려주세요.|preventive
oral-examination|구강 검사|Oral Examination|예방·관리|치아·잇몸·점막·턱관절을 눈과 기구로 살피는 검사입니다. 6개월마다 권장됩니다.|preventive
treatment-consent|설명 후 동의|Explanation and Consent|보험·제도|치료 내용·비용·기간·대안을 설명 듣고 동의하는 과정입니다. 궁금한 점은 언제든 질문하세요.|preventive
appointment|예약 진료|Appointment System|보험·제도|대기 시간을 줄이고 충분한 치료 시간을 확보하기 위한 방식입니다. 도담치과는 예약 우선으로 진료하며 화요일은 야간 진료를 운영합니다.|preventive
night-clinic|야간 진료|Evening Clinic|보험·제도|직장인을 위해 저녁까지 운영하는 진료입니다. 도담치과는 화요일 20시 30분까지 진료합니다.|preventive
emergency-dental|치과 응급 상황|Dental Emergency|증상|심한 통증·얼굴 부종·치아 탈구·출혈이 멈추지 않는 경우입니다. 진료 시간 내 즉시 연락하시면 우선 진료를 도와드립니다.|oral-surgery,endodontics
post-treatment-care|치료 후 관리|Post-treatment Care|예방·관리|치료 종류별 주의사항(식사·양치·약 복용)을 지키는 것입니다. 회복 속도와 결과를 좌우합니다.|preventive
recall|리콜(정기 관리 안내)|Recall System|예방·관리|치료 후 정해진 시기에 검진을 안내하는 시스템입니다. 도담치과 회원은 예약 알림을 받을 수 있습니다.|preventive
oral-health-education|구강 보건 교육|Oral Health Education|예방·관리|올바른 칫솔질·치실·식습관을 배우는 것입니다. 도담치과는 검진 시 개인별 관리법을 안내합니다.|preventive
plaque-disclosing|치면 착색 검사|Plaque Disclosing|예방·관리|치태를 붉게 염색해 칫솔질이 부족한 부위를 눈으로 확인하는 검사입니다.|preventive,pediatric
caries-risk-assessment|충치 위험도 평가|Caries Risk Assessment|예방·관리|식습관·침 분비·과거 충치·불소 사용을 종합해 충치 위험을 평가하고 관리 주기를 정하는 것입니다.|preventive
oral-cancer-screening|구강암 검진|Oral Cancer Screening|예방·관리|입안 점막의 이상 병변을 살피는 검사입니다. 3주 이상 낫지 않는 궤양·백반은 조직검사가 필요합니다.|preventive
leukoplakia|백반증|Leukoplakia|증상|입안 점막에 생긴 지워지지 않는 흰 반점입니다. 흡연과 관련이 깊고 전암 병변일 수 있어 검사가 필요합니다.|oral-surgery
oral-thrush|구강 칸디다증|Oral Candidiasis|증상|곰팡이(칸디다) 감염으로 입안에 하얀 막이 생기는 질환입니다. 틀니 사용자·면역 저하자에서 흔합니다.|prosthodontics
herpes-labialis|입술 헤르페스|Herpes Labialis|증상|피로·스트레스 시 입술에 생기는 물집입니다. 활성기에는 치과 치료를 미루는 것이 좋습니다.|preventive
geographic-tongue|지도상 설|Geographic Tongue|증상|혀 표면에 지도 모양의 붉은 반점이 생기는 양성 상태입니다. 치료가 필요하지 않은 경우가 많습니다.|preventive
burning-mouth|구강 작열감 증후군|Burning Mouth Syndrome|증상|눈에 보이는 병변 없이 입안이 화끈거리는 증상입니다. 중년 여성에서 흔하고 원인이 복합적입니다.|preventive
taste-disorder|미각 이상|Taste Disorder|증상|맛을 못 느끼거나 이상하게 느끼는 증상입니다. 약물·구강건조·아연 결핍 등이 원인일 수 있습니다.|preventive
tooth-wear|치아 마모|Tooth Wear|증상|치아가 닳아 없어지는 현상의 총칭입니다. 교모(치아끼리)·마모(외부 물질)·침식(산)이 있으며 원인에 따라 관리가 다릅니다.|restorative,tmj
diastema|치아 사이 틈(치간이개)|Diastema|증상|앞니 사이가 벌어진 상태입니다. 레진·바이오클리어로 삭제 없이 메울 수 있습니다.|restorative
gummy-smile|거미 스마일|Gummy Smile|증상|웃을 때 잇몸이 많이 보이는 상태입니다. 원인에 따라 잇몸 성형 등으로 개선 가능합니다.|periodontal
tooth-shape|치아 형태 이상|Tooth Shape Anomaly|증상|왜소치·융합치 등 형태가 다른 치아입니다. 심미·기능 문제가 있으면 레진이나 보철로 개선합니다.|restorative,prosthodontics
enamel-hypoplasia|법랑질 형성부전|Enamel Hypoplasia|증상|치아 형성 시기의 영양·질병으로 법랑질이 얇거나 패인 상태입니다. 충치에 취약해 예방 관리가 중요합니다.|pediatric,restorative
mih|MIH(어금니 앞니 저광화)|Molar Incisor Hypomineralization|소아치과|첫째 큰어금니와 앞니에 노란·갈색 얼룩이 생기고 잘 깨지는 상태입니다. 시림이 심해 조기 보호가 필요합니다.|pediatric
bottle-caries|우유병 우식|Baby Bottle Caries|소아치과|젖병을 물고 자는 습관으로 위 앞니에 광범위하게 생기는 충치입니다. 돌 이후 밤중 수유를 줄이는 것이 예방입니다.|pediatric
child-behavior-management|소아 행동 조절|Pediatric Behavior Management|소아치과|아이가 치료에 협조할 수 있도록 돕는 방법입니다. 도담치과는 약물 없이 설명·칭찬·단계적 적응으로 진행하며 수면 진료는 시행하지 않습니다.|pediatric
tooth-fairy-eruption-chart|치아 교환 시기표|Tooth Eruption Chart|소아치과|유치가 빠지고 영구치가 나는 평균 시기를 정리한 표입니다. 아래 앞니 6~7세, 큰어금니 6세, 송곳니 9~12세가 대표적입니다.|pediatric
six-year-molar|6세 구치|First Permanent Molar|소아치과|만 6세 무렵 유치 뒤쪽에 새로 나는 첫 영구 큰어금니입니다. 유치로 오해해 방치되기 쉬워 실란트로 보호합니다.|pediatric,preventive
shark-teeth|이중 치열(샤크 투스)|Shark Teeth|소아치과|유치가 빠지지 않은 채 영구치가 안쪽에서 나오는 현상입니다. 대부분 자연 해결되나 유치가 오래 남으면 발치합니다.|pediatric
crown-fracture-child|어린이 치아 깨짐|Pediatric Crown Fracture|소아치과|놀다가 앞니가 깨지는 흔한 외상입니다. 깨진 조각을 가져오면 붙일 수 있는 경우도 있습니다.|pediatric
tmj-in-teens|청소년 턱관절 장애|Adolescent TMD|턱관절|학업 스트레스·자세·이악물기로 10대에도 턱관절 증상이 늘고 있습니다. 습관 조절과 스플린트로 관리합니다.|tmj
posture-tmj|자세와 턱관절|Posture and TMJ|턱관절|거북목·턱 괴기·엎드려 자기 등이 턱관절에 부담을 줍니다. 자세 교정이 치료의 일부입니다.|tmj
stress-bruxism|스트레스와 이갈이|Stress and Bruxism|턱관절|스트레스는 이갈이·이악물기의 주요 유발 요인입니다. 수면 위생과 이완 훈련이 도움이 됩니다.|tmj
sleep-apnea-dental|수면무호흡과 치과|Sleep Apnea and Dentistry|턱관절|이갈이와 수면무호흡은 함께 나타나는 경우가 많습니다. 구강 장치가 경증 무호흡에 도움이 될 수 있습니다.|tmj
periodontal-30s|30대 잇몸 관리|Gum Care in Your 30s|치주(잇몸)|치주염이 본격적으로 시작되는 시기입니다. 증상이 거의 없어 놓치기 쉬우므로 30대부터 연 1~2회 치주 검진과 스케일링이 뼈를 지키는 가장 확실한 방법입니다.|periodontal
gum-recession-brushing|칫솔질과 잇몸 퇴축|Brushing and Recession|치주(잇몸)|세게 옆으로 닦는 습관은 잇몸을 내려가게 하고 치아를 마모시킵니다. 부드러운 칫솔로 가볍게 닦는 것이 중요합니다.|periodontal,preventive
periodontal-heart|치주염과 심혈관 질환|Periodontitis and Heart Disease|전신질환·약물|치주염 세균과 염증 물질이 혈관을 타고 전신에 영향을 줄 수 있다는 연구가 많습니다. 잇몸 건강은 전신 건강과 연결됩니다.|periodontal
periodontal-pregnancy|치주염과 임신|Periodontitis and Pregnancy|전신질환·약물|임신 중 잇몸 염증이 심해지기 쉽고 조산과의 연관성이 보고됩니다. 임신 전·중기 치주 관리를 권합니다.|periodontal
implant-vs-bridge|임플란트 vs 브릿지|Implant vs Bridge|임플란트|임플란트는 옆 치아를 보존하고 뼈를 유지하지만 수술과 기간이 필요합니다. 브릿지는 빠르지만 양옆 치아를 삭제해야 합니다. 도담치과는 옆 치아 상태를 기준으로 함께 결정합니다.|implant,prosthodontics
implant-vs-denture|임플란트 vs 틀니|Implant vs Denture|임플란트|틀니는 수술이 없고 비용이 적지만 씹는 힘과 안정성이 낮습니다. 임플란트 틀니는 둘의 장점을 합친 선택지입니다.|implant,prosthodontics
implant-timeline|임플란트 치료 기간|Implant Treatment Timeline|임플란트|발치 후 2~3개월 대기 → 식립 → 골유착 2~6개월 → 보철 2~3주. 뼈이식이 있으면 더 길어질 수 있습니다.|implant
implant-pain|임플란트 수술 통증|Implant Surgery Discomfort|임플란트|수술은 마취 상태로 진행되며 술 후 2~3일 뻐근함이 흔합니다. 처방약과 냉찜질로 대부분 조절됩니다.|implant
implant-food|임플란트 후 식사|Diet after Implant|임플란트|수술 후 1주는 부드럽고 미지근한 음식, 골유착 기간엔 반대쪽 씹기를 권합니다. 최종 보철 후에는 정상 식사가 가능합니다.|implant
implant-smoking|임플란트와 흡연|Implants and Smoking|임플란트|흡연은 골유착 실패와 임플란트 주위염 위험을 크게 높입니다. 최소 수술 전후 2주 금연을 권합니다.|implant
implant-age|임플란트 가능 나이|Implant Age Requirements|임플란트|성장이 끝난 만 18~20세 이후 가능하며 상한은 없습니다. 고령이라도 전신 상태가 양호하면 가능합니다.|implant
implant-warranty|임플란트 보증|Implant Warranty|보험·제도|치과별로 일정 기간 재시술·수리를 보장하는 제도입니다. 정기 검진 이행이 조건인 경우가 많습니다.|implant
vpt-vs-rct|치수보존치료 vs 신경치료|VPT vs Root Canal|신경치료|VPT는 신경을 살려 치아 수명을 늘리고 치료 횟수가 적습니다. 다만 염증이 이미 깊으면 신경치료가 필요합니다. 도담치과는 큐레이·검사로 살릴 수 있는지 먼저 판단합니다.|vpt-crown,endodontics
vpt-success|치수보존치료 성공률과 관리|VPT Prognosis|신경치료|적응증을 잘 선택하면 높은 성공률이 보고됩니다. 치료 후 6개월~1년 추적 검사로 치수 반응을 확인하는 것이 중요합니다.|vpt-crown
vpt-crown-why|VPT 후 크라운이 필요한 이유|Crown after VPT|신경치료|치수를 살려도 치아 구조 손실이 크면 크랙과 세균 재침입을 막기 위해 크라운으로 밀봉·보호합니다. 도담치과는 VPT와 크라운을 하나의 치료로 봅니다.|vpt-crown,prosthodontics
rct-visits|신경치료 횟수|Root Canal Visits|신경치료|보통 2~4회이며 감염 정도·근관 수에 따라 달라집니다. 중간에 아프지 않아도 마무리까지 꼭 오셔야 합니다.|endodontics
rct-pain-after|신경치료 후 통증|Post-endodontic Pain|신경치료|치료 후 1~3일 씹을 때 불편함은 정상 반응입니다. 심한 부종·통증이 지속되면 연락 주세요.|endodontics
rct-lifespan|신경치료 치아 수명|Longevity of Treated Teeth|신경치료|크라운으로 잘 보호하고 관리하면 자연치처럼 오래 쓸 수 있습니다. 크라운 없이 방치하면 파절 위험이 높습니다.|endodontics,prosthodontics
wisdom-when-to-extract|사랑니 발치 기준|When to Extract Wisdom Teeth|구강외과·사랑니|반복 염증, 옆 치아 충치·뿌리 손상, 물혹, 칫솔이 닿지 않는 위치일 때 권합니다. 똑바로 나서 잘 닦이면 유지합니다.|wisdom-tooth
wisdom-keep|사랑니를 유지하는 경우|Retaining Wisdom Teeth|구강외과·사랑니|정상 위치로 나서 교합에 참여하고 관리가 잘 되면 뺄 이유가 없습니다. 도담치과는 정기 검진으로 추적 관찰합니다.|wisdom-tooth
wisdom-recovery|사랑니 발치 후 회복|Recovery after Wisdom Tooth Removal|구강외과·사랑니|부종은 2~3일째 최고, 이후 1주 내 대부분 회복됩니다. 봉합사는 1~2주 후 제거합니다.|wisdom-tooth
wisdom-ct|사랑니 CT 촬영|CT for Wisdom Teeth|구강외과·사랑니|아래 사랑니가 신경관과 겹쳐 보이면 3D CT로 실제 위치를 확인해 신경 손상 위험을 줄입니다.|wisdom-tooth
wisdom-upper-lower|위·아래 사랑니 차이|Upper vs Lower Wisdom Teeth|구강외과·사랑니|위 사랑니는 뼈가 부드러워 발치가 비교적 간단하고, 아래 사랑니는 뼈가 단단하고 신경과 가까워 난이도가 높습니다.|wisdom-tooth
scaling-frequency|스케일링 주기|Scaling Frequency|치주(잇몸)|일반적으로 6개월~1년, 치주염 병력이 있으면 3~4개월을 권합니다. 치석 생성 속도는 개인차가 큽니다.|periodontal,preventive
scaling-myth|스케일링 오해|Scaling Myths|치주(잇몸)|'스케일링하면 치아가 깎인다·벌어진다'는 오해입니다. 치석이 빠지며 생긴 공간이 드러나는 것으로 치아 손상은 없습니다.|periodontal
scaling-after|스케일링 후 시림|Post-scaling Sensitivity|치주(잇몸)|치석이 덮고 있던 뿌리가 노출되어 며칠 시릴 수 있습니다. 대부분 1~2주 내 좋아집니다.|periodontal
gum-treatment-stages|잇몸치료 단계|Stages of Gum Treatment|치주(잇몸)|스케일링 → 치근활택술·소파술 → (필요 시) 잇몸 수술 → 유지 관리 순입니다. 단계별로 재평가하며 진행합니다.|periodontal
gum-treatment-insurance|잇몸치료 건강보험|Gum Treatment Insurance|보험·제도|치근활택술·치주소파술·치은박리소파술은 건강보험이 적용됩니다.|periodontal
crown-material-choice|크라운 재료 선택|Choosing Crown Material|보철(크라운·틀니)|앞니는 심미성이 좋은 지르코니아·이맥스, 어금니는 강도가 좋은 지르코니아·금이 주로 선택됩니다. 이갈이가 있으면 재료 선택이 달라집니다.|prosthodontics
crown-process|크라운 치료 과정|Crown Procedure|보철(크라운·틀니)|치아 다듬기 → 본뜨기(스캔) → 임시 크라운 → 1~2주 후 최종 접착. 보통 2회 방문입니다.|prosthodontics
crown-lifespan|크라운 수명|Crown Longevity|보철(크라운·틀니)|재료·관리에 따라 다르지만 정기 검진과 치실 사용으로 수명을 크게 늘릴 수 있습니다. 경계 부위 충치가 가장 흔한 실패 원인입니다.|prosthodontics
inlay-vs-crown|인레이 vs 크라운|Inlay vs Crown|보철(크라운·틀니)|남은 치아 벽이 충분하면 인레이로 보존하고, 벽이 얇거나 크랙·신경치료 후라면 크라운으로 전체 보호합니다.|restorative,prosthodontics
resin-vs-inlay|레진 vs 인레이|Resin vs Inlay|충치·보존치료|작은~중간 충치는 당일 레진, 넓거나 씹는 면이 많이 포함되면 인레이가 오래갑니다. 도담치과는 삭제량이 적은 쪽을 우선합니다.|restorative
resin-lifespan|레진 수명|Resin Longevity|충치·보존치료|위치·크기·관리에 따라 다르며 가장자리 착색이나 마모가 생기면 부분 수리도 가능합니다.|restorative
cavity-no-pain|아프지 않은 충치|Painless Caries|충치·보존치료|충치는 신경 근처까지 가기 전엔 대부분 통증이 없습니다. '안 아프니 괜찮다'가 가장 흔한 오해입니다.|restorative,preventive
cavity-progression|충치 진행 단계|Caries Progression|충치·보존치료|법랑질(무증상) → 상아질(시림) → 치수 근접(통증) → 치수염(자발통) → 괴사·농양. 단계가 낮을수록 치료가 간단합니다.|restorative,endodontics
whitening-safety|미백 안전성|Whitening Safety|미백|치과에서 관리하는 미백은 법랑질을 손상시키지 않습니다. 잇몸 보호와 적정 농도 사용이 중요합니다.|whitening
whitening-candidates|미백이 어려운 경우|Whitening Limitations|미백|보철물·레진은 미백되지 않고, 임신·수유 중·심한 시림·법랑질 결손은 미백을 피합니다.|whitening
kakao-consult|카카오톡 상담|Kakao Consultation|보험·제도|도담치과는 카카오톡 채널로 예약·간단한 문의를 받습니다. 정확한 진단은 내원 후 가능합니다.|preventive
first-visit-guide|첫 방문 안내|First Visit Guide|보험·제도|신분증(건강보험 확인)·복용 약 목록을 준비하시고 예약 시간 10분 전 도착을 권합니다. 주차는 건물 주차장을 이용할 수 있습니다.|preventive
dental-photos-record|구강 사진 기록|Clinical Photography|예방·관리|치료 전후 구강 사진을 기록해 변화를 추적하고 설명에 활용합니다. 개인정보로 안전하게 관리됩니다.|preventive
`
