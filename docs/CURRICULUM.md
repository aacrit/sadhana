# Sādhanā — Complete Curriculum

Last updated: 2026-04-12

---

MUSIC DIRECTION BRIEF -- Sadhana
Date: 2026-04-12

---

# COMPLETE HINDUSTANI CLASSICAL CURRICULUM
## Four Levels: Shishya, Sadhaka, Varistha, Guru

---

## FOUNDATIONAL RATIONALE

The sequencing of this curriculum follows three interlocking principles drawn from the gharana teaching tradition:

**1. The Pandit Jasraj Principle (Accessibility Without Dilution):** Every concept is experienced aurally before it is named or analyzed. The student's ear leads; theory follows. This is not simplification -- it is the traditional method. A guru sings; the shishya listens, then imitates. Only after the phrase lives in the voice does the guru name it.

**2. The Bhatkhande Systematic Principle:** Ragas are sequenced by structural complexity -- number of swaras, number of alterations from shuddha, degree of vakra (oblique) movement, ornamental density. This is the same logic Bhatkhande used when organizing ragas under thaats: start with the structurally transparent, proceed toward the structurally dense.

**3. The Ali Akbar College Bridge Principle:** Western students need anchor points. Each new concept connects to something already understood -- but the connection is always framed as "you may notice..." not "this is the same as..." The student learns to hear in Hindustani terms, using Western familiarity only as a temporary scaffold that is progressively removed.

**Why this ordering of ragas specifically:**
- Bhoopali first because pentatonic, all shuddha, no altered swaras -- the student cannot make a "wrong" komal/tivra choice
- Yaman second because sampoorna with only one alteration (Ma tivra) -- introduces the concept of vikrit swaras with minimal confusion
- Bhairav third because it introduces komal swaras (Re, Dha) but in a symmetrical structure that is easier to internalize than asymmetric ragas
- Bhimpalasi fourth because audava-sampoorna asymmetry is a new structural concept, and komal Ga/Ni are different komal swaras than Bhairav's
- Bageshri fifth because it shares Kafi thaat with Bhimpalasi, allowing the student to understand how two ragas with the same swara set can sound utterly different

This is the standard gurukul sequencing: pentatonic pure, sampoorna with one vikrit, sampoorna with two vikrits (symmetric), asymmetric jati, then emotional complexity within familiar swara sets.

---

## LEVEL 1: SHISHYA (Beginner) -- Levels 1-3

### Current State
Five lessons exist: B-01 Bhoopali, B-02 Sa-Pa Drone, B-03 Yaman, B-04 Bhairav, B-05 Bhimpalasi. No Bageshri lesson. No consolidation or review exercises. No explicit level-up challenge.

### What Is Needed

**B-06: Raga Bageshri -- The Midnight Raga**
Bageshri exists in the engine but has no lesson. It is the emotional capstone of Shishya: after four ragas of increasing structural complexity, Bageshri asks the student to feel, not just match pitch. It shares Kafi thaat with Bhimpalasi (komal Ga, komal Ni) but has entirely different character -- this teaches the student the fundamental Hindustani principle that raga identity is not the note set, it is the movement.

Musical rationale for placing Bageshri last in Shishya: The student already knows komal Ga and komal Ni from Bhimpalasi. The structural difference (Bageshri omits Re in aroha; Bhimpalasi omits Re and Dha in aroha) becomes a lesson in how subtle changes in movement create completely different emotional worlds. Bageshri's vadi is Ma (same as Bhimpalasi), but the phrase Sa-Ma-Ga(k)-Ma has an obsessive, circling quality that is emotionally distinct from Bhimpalasi's rising arc Ni(k)-Sa-Ga(k)-Ma.

Lesson structure follows existing pattern:
- Tanpura drone (30s)
- Sa calibration (skip if set)
- Aroha listen (hear without labels, twice)
- Aroha show (hear with labels)
- Avaroha listen/show
- Meet the swaras -- emphasize the Sa-Ma leap (Re omitted in aroha)
- Compare with Bhimpalasi: "You know these swaras. But listen to how different this raga sounds."
- Sing Sa, then sing the pakad phrase Sa-Ma-Ga(k)-Ma
- Pakad watch (60s free singing)
- Session summary

Tantri configuration: Same as B-05. Strings visible: Sa, Re, Ga_k, Ma, Pa, Dha, Ni_k. Interaction: voice only (touch hints but not primary). Accuracy: shishya (plus/minus 50 cents).

**B-07: The Five Ragas -- Consolidation**
A review lesson that cycles through all five learned ragas. The student hears a pakad phrase and identifies which raga it belongs to. This is the first "test" but framed as ear training, not examination.

Phase types needed: `raga_identification` -- engine plays a pakad from one of the known ragas, student either sings the raga name's Sa (confirming they recognize it) or selects from visual options. This is a new phase type.

Structure:
- Tanpura drone (20s)
- Five rounds: engine plays a random pakad, student listens, then attempts to sing in that raga's character (3-4 swaras)
- Engine evaluates whether sung swaras match the correct raga grammar
- Session summary showing which ragas the student recognized

Tantri: All strings from all five ragas visible (the full set of unique swaras across Bhoopali/Yaman/Bhairav/Bhimpalasi/Bageshri). This is the first time the student sees more strings than a single raga requires.

**B-08: Shishya Challenge -- Gateway to Sadhaka**
The explicit level-up gate. Not a lesson -- a challenge. Must be completed across 3 separate sessions (not in one sitting, per the locked level system spec: "Sing Bhairav's pakad within plus/minus 20 cents across 3 separate sessions").

Phase type needed: `mastery_challenge` -- structured assessment with specific accuracy targets.

Requirements to pass:
1. Sing Sa and Pa within plus/minus 30 cents (stricter than normal shishya tolerance)
2. Sing the aroha and avaroha of any 3 of the 5 learned ragas (student chooses) with all swaras within plus/minus 40 cents
3. Sing a pakad phrase from at least 2 different ragas with recognizable character
4. Complete this across 3 separate sessions (not consecutive attempts in one session)

Musical rationale: The guru does not pass the shishya after one good day. Consistency across sessions demonstrates that the swaras have settled into the voice, not just the memory.

### Shishya Theory Concepts Introduced
- Sa is the anchor (not a fixed frequency -- it is YOUR frequency)
- Pa is the first consonance (3:2 ratio, even if we do not name the ratio)
- Shuddha vs komal vs tivra (by experience, not definition)
- Aroha and avaroha are different -- ragas have direction
- Jati: some ragas use 5 notes, some use 7, some use 5 up and 7 down
- Raga is not a scale -- two ragas with the same notes can sound completely different (Bageshri vs Bhimpalasi)
- Time of day association (mentioned, not enforced)

### Shishya Voice Exercises via Tantri
1. Sa drone matching -- hold Sa against tanpura, plus/minus 50 cents
2. Sa-Pa alternation -- move between the two achala swaras
3. Aroha singing -- follow guide tone up through the raga
4. Avaroha singing -- follow guide tone down
5. Pakad imitation -- hear a phrase, sing it back

### Shishya Tantri Configuration Summary
| Lesson | Strings Visible | Interaction Mode | Accuracy |
|--------|----------------|------------------|----------|
| B-01 Bhoopali | Sa, Re, Ga, Pa, Dha | Voice + guide | plus/minus 50 |
| B-02 Sa-Pa Drone | Sa, Pa | Voice only | plus/minus 50 |
| B-03 Yaman | Sa, Re, Ga, Ma_t, Pa, Dha, Ni | Voice + guide | plus/minus 50 |
| B-04 Bhairav | Sa, Re_k, Ga, Ma, Pa, Dha_k, Ni | Voice + guide | plus/minus 50 |
| B-05 Bhimpalasi | Sa, Re, Ga_k, Ma, Pa, Dha, Ni_k | Voice + guide | plus/minus 50 |
| B-06 Bageshri | Sa, Re, Ga_k, Ma, Pa, Dha, Ni_k | Voice + guide | plus/minus 50 |
| B-07 Consolidation | All unique swaras from 5 ragas | Voice + touch | plus/minus 50 |
| B-08 Challenge | Raga-specific per round | Voice only | plus/minus 30-40 |

---

## LEVEL 2: SADHAKA (Practitioner) -- Levels 4-6

### Musical Rationale

The Sadhaka level represents the transition from "meeting ragas" to "understanding ragas." The student now has five ragas in their ear. The work shifts from pitch matching to musical understanding: ornaments, grammar rules, tala awareness, and the ability to distinguish similar ragas.

This is the level where the gharana tradition introduces alankars (ornamental exercises) and begins tala training. In the Ali Akbar College curriculum, this corresponds to the second-year student who can hold pitch but now must learn to move musically.

### New Ragas: Desh and Kafi

**Raga Desh (Khamaj thaat)**
- Aroha: S R G M P N S' (sampoorna, but some traditions omit Ga in aroha)
- Avaroha: S' n D P M G R S (komal Ni in descent)
- Vadi: Re; Samvadi: Pa
- Time: Late evening / monsoon night (prahara 5-6)
- Rasa: Shringar (romance), Karuna (gentle pathos)
- Key feature: Both shuddha Ni (in aroha) and komal Ni (in avaroha). This is the first time the student encounters a raga that uses two forms of the same swara. This is a critical pedagogical moment.
- Western bridge: "Western listeners may notice the quality shifts when the seventh note changes between ascent and descent -- this fluid use of a swara in two forms is characteristic of many ragas."
- Ornaments: Meend, kan, murki, khatka
- Pakad: P M G, M G R S, N D N S', S R G P
- Related ragas: Khamaj, Tilak Kamod, Jhinjhoti

Why Desh at Sadhaka: Desh introduces the concept of mixed swaras (Ni shuddha in aroha, Ni komal in avaroha). This is too complex for Shishya but essential before Varistha ragas where multiple mixed swaras are common. Desh is also beloved and accessible -- a folk-flavored raga that students enjoy singing, which sustains motivation through what is otherwise a technically demanding level.

**Raga Kafi (Kafi thaat)**
- Aroha: S R g M P D n S' (all shuddha except Ga komal and Ni komal)
- Avaroha: S' n D P M g R S
- Vadi: Pa; Samvadi: Sa (some traditions: Re)
- Time: Late evening (prahara 5-6), also spring (Holi)
- Rasa: Shringar, Hasya (humor, lightness)
- Key feature: This is the thaat raga itself -- the "parent" of the thaat the student already knows from Bhimpalasi and Bageshri. Learning Kafi after those two child ragas is illuminating: the student already knows the komal swaras, but now encounters them in their "pure" thaat form, with straightforward sampoorna-sampoorna movement. The simplicity of Kafi after the vakra complexity of Bhimpalasi teaches the student that structural simplicity does not mean emotional simplicity.
- Western bridge: "Western listeners may hear something resembling the Dorian mode, but Kafi's identity comes from its connection to folk forms, its characteristic meend on komal Ga, and the lightness absent from the Western minor tradition."
- Ornaments: Meend, kan, murki, khatka, gamak
- Pakad: g M P, P D n S', n D P M g R S, S R g M P
- Related ragas: Bhimpalasi, Bageshri, Pilu, Sindhura

Why Kafi at Sadhaka: The student already knows Kafi thaat swaras from Bhimpalasi and Bageshri. Kafi the raga gives them the direct, unadorned parent form. This is when the concept of thaat as organizational framework becomes concrete -- three ragas, same swara set, three completely different personalities.

### Sadhaka Lesson Sequence

**S-01: Raga Desh -- The Monsoon Raga**
- Introduction following Presence Rule
- Key pedagogical moment: introduce shuddha Ni in aroha, then komal Ni in avaroha. Have the student hear the shift. "The same position in the scale. Two different colors."
- Phase type: `swara_comparison` -- hear shuddha Ni, then komal Ni, then the aroha with shuddha Ni, then the avaroha with komal Ni
- First ornament exposure: meend from Pa to Ga in Desh context

**S-02: Ornament Introduction -- Meend (The Glide)**
- Not raga-specific. A standalone exercise lesson.
- The student learns to glide continuously from one swara to another
- Phase type needed: `ornament_exercise` -- engine plays a meend, student imitates. Pitch detection tracks the trajectory, not just endpoint.
- Start with Sa to Re meend (smallest interval). Progress to Sa to Ga, then Sa to Pa.
- Engine evaluates: smooth trajectory (no steps), arrival accuracy, duration control
- Musical rationale: Meend is introduced first because it is the defining ornament of Hindustani vocal music, it is the slowest (easiest to track with pitch detection), and it reveals the microtonal landscape between swaras. In the gurukul tradition, meend is the first ornament taught because it requires control but not speed.

**S-03: Ornament Introduction -- Andolan (The Gentle Wave)**
- Taught specifically in Bhairav context, because andolan on komal Re and komal Dha IS Bhairav
- Phase type: `ornament_exercise` with oscillation detection
- Student sings komal Re and learns to add andolan: 2-4 Hz, 15-40 cents oscillation
- Engine evaluates: oscillation rate (is it in the andolan range, not gamak range?), stability (does the oscillation stay centered on the target swara?)
- Musical rationale: Andolan is the second ornament because it is slow and gentle (like meend), but adds the new concept of sustained oscillation. The student already knows Bhairav's komal Re from Shishya -- now they learn to sing it properly, with the characteristic oscillation that gives Bhairav its gravity.

**S-04: Raga Kafi -- The Parent Raga**
- Introduction following Presence Rule
- Key pedagogical moment: "You already know the swaras of Kafi. You sang them in Bhimpalasi. You sang them in Bageshri. Now hear them in their simplest form."
- Phase type: `raga_comparison` -- play Bhimpalasi pakad, then Kafi pakad, then Bageshri pakad. Same swaras. Three worlds.
- This is when the concept of thaat is explicitly introduced: "These three ragas share a parent. The parent is Kafi."

**S-05: Tala Awareness -- Teentaal (The First Rhythm)**
- Not raga-specific. Standalone rhythm lesson.
- Phase type needed: `tala_exercise` -- engine plays teentaal (16 beats, 4+4+4+4), student claps sam (beat 1) and khali (beat 9)
- Progression: hear the cycle, identify sam by ear, clap along, then sing Sa on sam
- Engine evaluates: timing accuracy of clap/voice onset relative to beat positions
- Musical rationale: Teentaal is the most common tala in Hindustani music and the most symmetric (four equal vibhags). It is introduced at Sadhaka because rhythm awareness requires a stable pitch foundation -- the student must be able to hold Sa while tracking beats. This is the integration of melody and rhythm that defines the sadhaka stage.

**S-06: Raga Grammar -- Aroha/Avaroha Rules**
- Uses Bhimpalasi and Bageshri as case studies
- Phase type needed: `grammar_exercise` -- engine presents a phrase, student determines if it is valid or invalid in a given raga
- Example: "Is Sa Re Ga Ma Pa valid in Bhimpalasi?" (No -- Re and Dha are omitted in aroha. The correct ascending phrase skips Re.)
- The student learns that ragas have rules of movement, not just pitch sets
- Musical rationale: Grammar awareness transforms the student from someone who matches pitches to someone who understands why certain phrases feel right in certain ragas. This is the beginning of musical intelligence.

**S-07: Ornament Introduction -- Gamak (The Shake)**
- Taught in Bhimpalasi or Bhairav context
- Phase type: `ornament_exercise` with oscillation detection
- Gamak is faster and wider than andolan: 4-8 Hz, 50-150 cents
- Student sings a swara, then adds vigorous oscillation
- Engine evaluates: oscillation rate (must be in gamak range, faster than andolan), amplitude (wider than andolan)
- Musical rationale: Gamak is the third ornament because it builds on andolan's oscillation concept but demands more energy and speed. The progression is: meend (linear glide) then andolan (slow oscillation) then gamak (fast oscillation). Each builds on the last.

**S-08: Call and Response -- Ornamented Phrases**
- Raga-specific: uses all learned ragas
- Phase type: `call_response` with ornament detection
- Engine plays a phrase with a specific ornament (meend on Ga in Yaman, andolan on Re_k in Bhairav, gamak on Ma in Bhimpalasi)
- Student sings it back, including the ornament
- Engine evaluates both pitch accuracy and ornament presence

**S-09: Interval Recognition in Raga Context**
- Phase type needed: `interval_exercise` -- engine plays two swaras, student identifies the interval
- Not Western interval naming (no "perfect fifth") -- Hindustani interval awareness: "Is this Sa-Pa, Sa-Ma, or Sa-Ga?"
- Progression: start with Sa-Pa (most consonant), add Sa-Ma, Sa-Ga, Sa-Re, then Sa-Re_k, Sa-Ga_k
- Musical rationale: Interval recognition is essential for phrase recognition. The student who can hear the interval can hear the raga. This exercise trains the ear to distinguish intervals within the just-intonation framework, not equal temperament.

**S-10: Sadhaka Challenge -- Gateway to Varistha**
Phase type: `mastery_challenge`

Requirements to pass (across 3 separate sessions):
1. Sing the aroha and avaroha of all 7 learned ragas within plus/minus 25 cents
2. Sing a meend from any swara to a swara at least 3 positions away, with smooth trajectory (no steps)
3. Sing andolan on komal Re in Bhairav context (oscillation detected at 2-4 Hz, 15-40 cents)
4. Identify 4 out of 5 ragas from pakad phrases (raga_identification)
5. Clap sam and khali of teentaal for 4 consecutive cycles

### Sadhaka Theory Concepts Introduced
- Thaat: parent scale framework (Kafi thaat demonstrated across 3 ragas)
- Vadi/Samvadi: the most important swara and its partner
- Ornaments are raga-specific: andolan belongs to Bhairav's komal Re, not to every komal Re
- Tala basics: sam, khali, vibhag, cycle
- Mixed swaras: a single raga can use both forms of a swara (Desh)
- Raga grammar: rules of movement beyond just the note set

### Sadhaka Voice Exercises via Tantri
1. Meend between adjacent swaras -- smooth glide, pitch trajectory tracked
2. Andolan on held swaras -- oscillation rate and amplitude measured
3. Gamak on held swaras -- faster, wider oscillation
4. Ornamented phrase imitation -- call-response with ornaments
5. Sargam singing (full scale with accuracy scoring per swara) at plus/minus 25 cents
6. Rhythmic Sa chanting -- sing Sa on sam of teentaal

### New Phase Types Required for Sadhaka
1. `ornament_exercise` -- engine plays ornament, student imitates, pitch trajectory evaluated
2. `swara_comparison` -- hear two forms of same swara (e.g., Ni vs Ni_k)
3. `raga_comparison` -- hear pakads from different ragas side by side
4. `grammar_exercise` -- evaluate whether a phrase is valid in a given raga
5. `tala_exercise` -- rhythm awareness with clapping/singing on beat
6. `interval_exercise` -- identify interval between two swaras
7. `raga_identification` -- hear pakad, identify which raga (also used in B-07)

### Sadhaka Tantri Configuration Summary
| Lesson | Strings Visible | Interaction Mode | Accuracy |
|--------|----------------|------------------|----------|
| S-01 Desh | Sa, Re, Ga, Ma, Pa, Dha, Ni, Ni_k | Voice + touch | plus/minus 25 |
| S-02 Meend | Raga-dependent (start with Bhoopali for simplicity) | Voice only | trajectory |
| S-03 Andolan | Sa, Re_k, Ga, Ma, Pa, Dha_k, Ni (Bhairav) | Voice only | oscillation |
| S-04 Kafi | Sa, Re, Ga_k, Ma, Pa, Dha, Ni_k | Voice + touch | plus/minus 25 |
| S-05 Teentaal | Sa only (rhythm focus) | Voice + clap | timing |
| S-06 Grammar | Raga-dependent per round | Voice + touch | grammar |
| S-07 Gamak | Raga-dependent | Voice only | oscillation |
| S-08 Call-Response | Raga-dependent per round | Voice only | plus/minus 25 + ornament |
| S-09 Intervals | Sa + target swara | Voice only | plus/minus 25 |
| S-10 Challenge | Raga-dependent per round | Voice only | plus/minus 25 |

All Sadhaka lessons show the full 7 shuddha swaras plus relevant vikrit swaras for the active raga.

---

## LEVEL 3: VARISTHA (Advanced) -- Levels 7-9

### Musical Rationale

The Varistha level is where the student becomes a musician. The shift is from executing phrases to creating phrases, from recognizing ragas to distinguishing closely related ragas, from singing ornaments to understanding why a specific ornament belongs to a specific swara in a specific raga. This is the equivalent of the advanced gurukul student who has completed basic training and now works on bandish, vistar, and compositional thinking.

The raga palette expands dramatically at this level. The Varistha student encounters ragas that are structurally challenging (Marwa, with no Pa), emotionally demanding (Darbari Kanada, with its profound andolan on komal Ga), and aesthetically subtle (Puriya Dhanashri, distinguished from Puriya by a single swara's emphasis).

### New Ragas: Marwa, Darbari Kanada, Puriya Dhanashri, Malkauns, Todi

**Raga Marwa (Marwa thaat)**
- Aroha: .N S r G M D N S' (characteristically begins from Ni of lower octave; Pa omitted or very weak)
- Avaroha: S' N D M G r S (Pa omitted)
- Vadi: Re_k; Samvadi: Dha
- Time: Sunset (prahara 4, sandhya prakaash -- the liminal moment)
- Rasa: Karuna (deep pathos), Veer (heroic intensity)
- Key feature: Pa is virtually absent. This creates a fundamental instability -- the student cannot anchor to the tonic's fifth. Re komal as vadi gives the raga an almost unbearable tension. Marwa does not resolve in the way other ragas do.
- Western bridge: "Western listeners may find Marwa unsettling -- the absence of the fifth (Pa) removes the most stable interval after the octave. This deliberate instability is the raga's purpose."
- Ornaments: Meend, andolan, kan
- Why at Varistha: Marwa is one of the most challenging ragas in the repertoire. The absence of Pa means the student cannot rely on the Sa-Pa axis that has been their anchor since lesson B-02. This is a test of musical maturity.

**Raga Darbari Kanada (Asavari thaat)**
- Aroha: S R g M P d n S' (some traditions: S R g R S, M P d n S' -- vakra approach)
- Avaroha: S' n d P M P g M R S
- Vadi: Re; Samvadi: Pa
- Time: Late night, midnight (prahara 7-8)
- Rasa: Gambhir (grave, profound), Karuna
- Key feature: The andolan on komal Ga is THE defining characteristic. This is not ordinary komal Ga -- in Darbari, Ga komal is sung with a slow, heavy andolan that touches the Re below. No other raga treats Ga komal this way. The gamak on komal Dha and komal Ni is also characteristic.
- Western bridge: "Western listeners may hear Aeolian or natural minor qualities, but Darbari's identity is inseparable from the heavy andolan on its komal Ga -- a treatment that cannot be notated in Western music and has no equivalent."
- Ornaments: Andolan (defining), gamak, meend, kan
- Why at Varistha: Darbari demands ornament mastery. The student cannot sing Darbari without correct andolan -- a flat komal Ga is not Darbari, it is Asavari. This is the raga that tests whether the student has truly internalized ornaments as structural elements, not decorations.

**Raga Puriya Dhanashri (Poorvi thaat)**
- Aroha: .N r G M D N S' (begins from Ni of lower octave)
- Avaroha: S' N D M G M r S (vakra -- Ma is touched in descent before Ga)
- Vadi: Ma_t (Ga in some traditions); Samvadi: Ni
- Time: Evening, sunset (prahara 4-5)
- Rasa: Shringar (devotion), Karuna
- Key feature: Closely related to Puriya (which omits Pa). Puriya Dhanashri uses Pa but de-emphasizes it. The distinction between these two ragas is subtle and teaches the Varistha student that raga identity can hinge on emphasis, not just note set.
- Western bridge: "Western listeners may find the combination of komal Re, tivra Ma, and komal Dha creates a quality of intense yearning with no Western analog."
- Ornaments: Meend (especially Ga to Re_k), andolan, kan
- Why at Varistha: This raga introduces the Poorvi thaat (3 altered swaras: Re_k, Ma_t, Dha_k) and the concept of closely related ragas that must be carefully distinguished.

**Raga Malkauns (Bhairavi thaat)**
- Aroha: S g M d n S' (audava -- Re and Pa omitted)
- Avaroha: S' n d M g S
- Vadi: Ma; Samvadi: Sa
- Time: Late night, midnight
- Rasa: Veer (heroic), Raudra (intensity), Karuna
- Key feature: Pentatonic with four komal swaras. Extremely powerful and austere. Like Bhoopali's structural twin in the dark register -- five notes, but all altered except Sa and Ma.
- Western bridge: "Western listeners may hear the pentatonic minor scale, but Malkauns's power comes from its emphasis patterns and its association with deep night intensity."
- Ornaments: Gamak (prominent), meend, kan
- Why at Varistha: Malkauns is a pentatonic raga, structurally simpler than many Sadhaka ragas. But it is placed here because its emotional intensity and the precision required for four komal swaras makes it an advanced challenge. The student who can sing Malkauns correctly has mastered komal intonation.

**Raga Todi (Todi thaat)**
- Aroha: S r g M P d N S' (some traditions: S r g r S, g M P d N S')
- Avaroha: S' N d P M g r S
- Vadi: Dha_k; Samvadi: Ga_k (some traditions reverse)
- Time: Late morning (prahara 2)
- Rasa: Karuna (pathos, intellectual depth)
- Key feature: The most chromatically dense raga in the curriculum. Three komal swaras (Re, Ga, Dha) plus tivra Ma. The compressed lower tetrachord (Sa-Re_k-Ga_k-Ma_t spans only about 500 cents) creates intense harmonic density.
- Western bridge: "Western listeners will find Todi unlike any familiar mode -- the combination of three flattened notes with one raised note creates a harmonic density that is uniquely Hindustani."
- Ornaments: Meend (definitive, especially in lower tetrachord), andolan, kan
- Why at Varistha: Todi is considered one of the six great ragas. Its chromatic density requires precise intonation of three komal swaras plus tivra Ma. This is the ultimate intonation challenge before Guru level.

### Varistha Lesson Sequence

**V-01: Raga Marwa -- The Absent Fifth**
- Introduction following Presence Rule
- Key pedagogical moment: The student listens for Pa and does not find it. "What is missing? The note you have relied on since your second lesson. Pa is not here."
- Exercise: Sing the scale without Pa. Notice how the body wants to sing Pa. The tension of its absence IS Marwa.
- Tantri shows all 12 chromatic swaras (Varistha disclosure level), but Pa string remains dark/inactive

**V-02: Raga Comparison -- Same Thaat, Different Worlds**
- Phase type needed: `raga_comparison_advanced` -- deeper than S-04's comparison
- Compare Bhimpalasi vs Bageshri vs Kafi (all Kafi thaat): play pakads, analyze differences
- Compare Yaman vs Bhoopali (both Kalyan thaat): same shuddha swaras (Bhoopali is a subset of Yaman)
- Key learning: thaat gives you the raw materials. Raga gives you the architecture.

**V-03: Raga Darbari Kanada -- The Profound Andolan**
- Introduction following Presence Rule
- Key pedagogical moment: The komal Ga that the student knows from Bhimpalasi, Bageshri, and Kafi is different here. In Darbari, it receives a heavy, slow andolan that is the single most recognizable sound in all of Hindustani music. "Every komal Ga is not the same. In Darbari, it breathes."
- Phase type: `ornament_exercise` with specific andolan parameters for Darbari Ga_k (2 Hz, 30-50 cents amplitude, touching Re below)

**V-04: Phrase Composition -- Creating Valid Phrases**
- Phase type needed: `composition_exercise` -- student sings freely, engine evaluates whether phrases are valid in the active raga's grammar
- Start in Bhoopali (simplest grammar), progress to Yaman, then Bhimpalasi
- Engine provides real-time grammar feedback: "That phrase used Re in the aroha of Bhimpalasi -- try skipping Re on the way up"
- Musical rationale: This is the transition from imitation to creation. The student who can compose valid phrases understands raga grammar intuitively.

**V-05: Raga Puriya Dhanashri -- Evening Tension**
- Introduction following Presence Rule
- Key pedagogical moment: Poorvi thaat -- three altered swaras at once (Re_k, Ma_t, Dha_k)
- Exercise: Distinguish Puriya Dhanashri from Marwa (both use Re_k and Ma_t, but Marwa omits Pa while Puriya Dhanashri uses Pa and adds Dha_k)

**V-06: Ornament Mastery -- Context-Specific Application**
- Not about learning new ornaments but about understanding which ornaments belong where
- Phase type: `ornament_context_exercise` -- engine presents a raga and a swara, student must apply the correct ornament
- Andolan on Re_k in Bhairav (correct). Gamak on Re_k in Bhairav (incorrect -- too vigorous).
- Meend from Ga to Re in Yaman (correct). Meend from Ga to Re in Bhoopali (incorrect -- Re is not a destination in Bhoopali's character).
- Musical rationale: Ornaments are not generic effects. They are part of the raga's grammar. The Varistha student must understand this deeply.

**V-07: Raga Malkauns -- Power in Five Notes**
- Introduction following Presence Rule
- Key pedagogical moment: "You began with a pentatonic raga -- Bhoopali. Now you meet another. Same structure. Opposite world."
- Compare Bhoopali (pentatonic shuddha) with Malkauns (pentatonic komal). Same number of notes. Entirely different universes.

**V-08: Shruti-Level Precision Exercises**
- Phase type needed: `shruti_exercise` -- exercises that distinguish between the two shruti variants of a swara
- Example: The two shrutis of komal Ga (6/5 and 32/27). In Bhimpalasi, Ga_k tends toward 6/5. In Darbari, Ga_k sits lower, closer to 32/27.
- Engine plays both shrutis, student learns to hear and reproduce the difference
- Musical rationale: This is where the student crosses from "correct swara" to "correct shruti" -- the 22-shruti system becomes real.

**V-09: Raga Todi -- Chromatic Density**
- Introduction following Presence Rule
- Key pedagogical moment: Four altered swaras. The most harmonically dense raga in the curriculum. "Every swara except Sa, Pa, and Ni is altered from shuddha. The scale is compressed. Dense. Every note is close to its neighbor."
- Exercise: Navigate the compressed lower tetrachord (Sa-Re_k-Ga_k-Ma_t) with precision

**V-10: Tala Integration -- Bol Patterns with Melody**
- Phase type needed: `tala_melody_exercise` -- sing sargam phrases aligned to tala cycles
- Progression: Sing aroha over one cycle of teentaal (arriving at Sa' on sam of next cycle)
- Then: Sing pakad phrases starting on sam
- Then: Sing improvised phrases that land on vadi on sam
- Musical rationale: The integration of melody and rhythm is the hallmark of the advanced musician. The student who can sing a raga phrase landing on the vadi precisely at sam has achieved a fundamental musical skill.

**V-11: Varistha Challenge -- Gateway to Guru**
Phase type: `mastery_challenge`

Requirements to pass (across 5 separate sessions -- stricter than Sadhaka):
1. Sing the aroha and avaroha of any 5 of the 12 learned ragas within plus/minus 15 cents
2. Demonstrate correct andolan on komal Ga in Darbari context (oscillation at correct rate and amplitude, touching Re)
3. Compose and sing a valid 8-swara phrase in Yaman that the engine validates as grammatically correct
4. Identify 7 out of 10 raga pakads (from all 12 ragas)
5. Sing a pakad phrase landing on sam of teentaal
6. Distinguish between two closely related ragas (engine picks from: Bhimpalasi/Bageshri, Puriya Dhanashri/Marwa, Bhoopali/Yaman) by singing a distinguishing phrase from each

### Varistha Theory Concepts Introduced
- Shruti: the 22 microtonal positions (not just 12 swaras, but their variants)
- Raga families: closely related ragas and how to distinguish them
- Ornament grammar: which ornament on which swara in which raga, and why
- Vakra movement: ragas that take indirect paths through the scale
- Chromatic density: how altered swaras compress or expand interval space
- Tala-melody integration: landing melodic phrases on rhythmic landmarks
- Phrase composition: creating valid phrases, not just imitating them

### New Phase Types Required for Varistha
1. `raga_comparison_advanced` -- detailed comparison of related ragas
2. `composition_exercise` -- student creates phrases, engine evaluates grammar
3. `ornament_context_exercise` -- apply correct ornament in correct raga context
4. `shruti_exercise` -- distinguish between shruti variants of the same swara
5. `tala_melody_exercise` -- integrate melody with tala structure

### Varistha Tantri Configuration
All 12 chromatic swaras visible on Tantri. Raga-specific strings glow/highlight; out-of-raga strings remain dim but visible. Interaction: voice primary, touch for reference. Accuracy: plus/minus 15 cents. Ornament detection active: andolan, meend, gamak tracked and scored.

---

## LEVEL 4: GURU (Master) -- Levels 10+

### Musical Rationale

The Guru level is not about learning more ragas. It is about depth, completeness, and the ability to teach. In the gharana tradition, the guru does not just perform -- the guru explains, demonstrates, and reveals. The Guru-level student demonstrates mastery by being able to analyze, compose, and render a raga completely, and by being able to articulate why musical decisions are made.

At this level, the app becomes less of a teacher and more of a practice partner. The student sets their own raga, their own tala, their own goals. The engine provides analysis, validation, and recording -- not instruction.

### New Ragas: Bhairavi, Kedar, Hameer, Sohini

**Raga Bhairavi (Bhairavi thaat)**
- Aroha: S r g M P d n S' (four komal swaras)
- Avaroha: S' n d P M g r S
- Vadi: Ma; Samvadi: Sa
- Time: Traditionally the concluding raga of any concert, any time
- Rasa: Bhakti (devotion), Karuna, Shant
- Key feature: Bhairavi is the most flexible raga in Hindustani music. In practice, all 12 swaras may appear as "chhayanat" (shading) -- shuddha Re, shuddha Ga, shuddha Dha, shuddha Ni, even tivra Ma can make fleeting appearances. The student must know which are structural and which are passing.
- Musical rationale for Guru placement: Bhairavi's flexibility makes it simultaneously the easiest and hardest raga. A beginner can sing it adequately. A master reveals infinite depth. The Guru student must demonstrate not just the basic form but the ability to shade with "foreign" swaras without losing the raga's identity.

**Raga Kedar (Kalyan thaat)**
- Aroha: S M P D N S' (Ma shuddha and Ma tivra both appear -- S M M' P D N S' in some renderings)
- Avaroha: S' N D P M G R S (Ma shuddha in descent)
- Vadi: Ma; Samvadi: Sa
- Time: Late evening (prahara 5)
- Key feature: Uses BOTH shuddha Ma and tivra Ma. The interplay between the two Mas is Kedar's signature.
- Why at Guru: Two forms of Ma requires sophisticated control and understanding.

**Raga Hameer (Kalyan thaat)**
- Aroha: S R G M P D N S' (shuddha Ma in aroha despite being Kalyan thaat)
- Avaroha: S' N D P M' G M R S (tivra Ma appears in descent)
- Vadi: Dha; Samvadi: Ga
- Time: Late evening (prahara 5-6)
- Key feature: Like Kedar, uses both Mas, but in reversed positions. This tests the student's understanding of how a single swara's treatment defines raga identity.
- Why at Guru: Hameer and Kedar both use both Mas but sound completely different. Understanding this distinction is a mark of mastery.

**Raga Sohini (Marwa thaat)**
- Aroha: S r G M D N S' (Pa omitted, like Marwa)
- Avaroha: S' N D M G r S
- Vadi: Dha; Samvadi: Ga (some traditions: Re_k)
- Time: Late evening to pre-midnight
- Key feature: Shares Marwa thaat and Pa-less quality with Marwa, but has completely different rasa. Sohini is light, sparkling, almost playful. Marwa is tense and heroic. Same structural constraint, opposite emotional world.
- Why at Guru: Distinguishing Sohini from Marwa when both omit Pa and use the same thaat is a definitive test of musical maturity.

### Guru Exercise Types

**G-01: Raga Identification from Sung Phrases**
- Phase type needed: `raga_identification_advanced` -- engine plays an alap-like phrase (not just pakad, but extended phrasing), student identifies the raga
- Phrases may include ornaments, vakra movement, and swaras from the upper register
- Pool: all 16+ ragas in the curriculum
- Guru-level accuracy: student must also identify the vadi and the time of day

**G-02: Bandish Structure -- Mukhda and Antara**
- Phase type needed: `bandish_exercise` -- engine presents the structure of a bandish (fixed composition)
- Student learns: mukhda (the refrain, returns to sam), antara (the upper register section)
- Student sings a provided mukhda in teentaal, landing precisely on sam
- Then: student composes their own mukhda in a given raga
- Musical rationale: Bandish is the vehicle for raga exposition in khayal gayaki. Understanding its structure is essential for any musician who aspires beyond exercises.

**G-03: Bhairavi -- The Flexible Raga**
- Introduction following Presence Rule
- Key exercise: Sing Bhairavi in its pure form (4 komal swaras). Then, guided by the engine, introduce shuddha Re as a passing note. Hear how it colors the raga without destroying it.
- Phase type needed: `controlled_deviation` -- student introduces specific "foreign" swaras under engine guidance, learning the boundaries of raga flexibility

**G-04: Cross-Raga Modulation Awareness**
- Phase type needed: `modulation_awareness` -- engine plays a phrase that transitions from one raga to another
- Student identifies the moment of transition and both ragas
- Example: A phrase in Yaman that touches shuddha Ma transitions to Yaman Kalyan. A phrase in Bhairav that introduces shuddha Re becomes Ahir Bhairav.
- Musical rationale: In concert, musicians sometimes allow one raga to "shade" into another before returning. This awareness is essential for advanced musicianship.

**G-05: Taan Patterns -- Fast Ornamental Runs**
- Phase type needed: `taan_exercise` -- rapid-fire sargam sequences in a raga
- Engine plays a taan (fast run through the scale or a portion of it), student imitates
- Start at slow tempo (60 BPM per note), increase
- Engine evaluates: every note hit, accuracy maintained at speed, raga grammar respected
- Musical rationale: Taan is the pinnacle of vocal technique in khayal gayaki. It combines pitch accuracy, speed, breath control, and raga grammar awareness simultaneously.

**G-06: Kedar and Hameer -- The Two Mas**
- A comparison lesson: both ragas use shuddha Ma and tivra Ma, but in different configurations
- Student must demonstrate: sing a phrase that is unmistakably Kedar, then a phrase that is unmistakably Hameer
- The difference is in where each Ma appears in the phrase structure

**G-07: Sohini vs Marwa -- Same Constraint, Different Worlds**
- Both omit Pa. Both use Marwa thaat swaras.
- The student sings phrases that distinguish them: Marwa's heroic tension vs Sohini's sparkling lightness
- This is the ultimate raga distinction exercise

**G-08: Complete Raga Rendering -- Alap, Jod, Jhala**
- Phase type needed: `raga_rendering` -- the student performs a complete, unaccompanied raga exposition
- Structure: Alap (slow, meditative exploration of the raga, no rhythm), Jod (rhythmic pulse introduced), Jhala (fast, energetic conclusion)
- Engine evaluates: raga grammar adherence, ornament usage, swara emphasis patterns (does vadi receive more weight?), phrasing quality
- This is the capstone exercise: the student IS the musician
- Musical rationale: Alap-jod-jhala is the oldest and most rigorous form of raga exposition, predating bandish-based khayal. A musician who can render a convincing alap-jod-jhala in any raga has demonstrated complete mastery of that raga.

**G-09: Teaching Exercise -- Explain to Demonstrate Understanding**
- Phase type needed: `teaching_exercise` -- the student "teaches" a raga to the app
- The student sings the aroha, avaroha, vadi emphasis, pakad, and characteristic ornaments
- Engine evaluates: completeness (did the student cover all essential elements?), accuracy, ornament appropriateness
- The student then records a voice note explaining the raga's character, time, rasa
- Musical rationale: The guru who cannot teach does not truly know. This is the traditional test of mastery -- can you transmit the raga to another?

**G-10: Open Mastery -- No Ceiling**
- Guru level has no upper bound. The student continues with increasingly subtle challenges:
- Rare ragas (the app suggests ragas outside the core curriculum for independent exploration)
- Ektaal compositions (12 beats -- more complex rhythmic structure)
- Rupak taal (7 beats, sam is khali -- the most counterintuitive tala)
- Multi-octave phrases (mandra, madhya, taar saptak in one phrase)
- The engine serves as practice partner, not teacher

### Guru Theory Concepts
- Bandish structure: mukhda, antara, sanchari, abhog
- Alap-jod-jhala: the complete raga exposition structure
- Raga flexibility: the concept of "chhayanat" (shading with foreign swaras)
- Cross-raga modulation: where one raga shades into another
- Taan grammar: rules for fast ornamental runs within a raga
- Teaching methodology: how to transmit raga knowledge
- Ektaal and Rupak taal structures

### New Phase Types Required for Guru
1. `raga_identification_advanced` -- identify raga from extended phrases with ornaments
2. `bandish_exercise` -- learn and compose bandish (mukhda/antara)
3. `controlled_deviation` -- introduce foreign swaras under controlled conditions
4. `modulation_awareness` -- identify raga transitions
5. `taan_exercise` -- rapid sargam runs with accuracy at speed
6. `raga_rendering` -- complete alap-jod-jhala exposition
7. `teaching_exercise` -- demonstrate raga knowledge by "teaching" it

### Guru Tantri Configuration
All 12 chromatic swaras visible. Raga-aware highlighting. Ornament indicators on relevant strings. Accuracy: plus/minus 10 cents. Full shruti detection (22-position awareness, not just 12-swara). Voice interaction primary; touch for reference and composition sketching.

---

## COMPLETE RAGA SEQUENCE ACROSS ALL LEVELS

| # | Raga | Level | Thaat | Jati | Altered Swaras | Pedagogical Purpose |
|---|------|-------|-------|------|----------------|---------------------|
| 1 | Bhoopali | Shishya 1 | Kalyan | 5-5 | 0 | First raga. Pentatonic. All shuddha. Pure. |
| 2 | Yaman | Shishya 1 | Kalyan | 7-7 | 1 (Ma_t) | First sampoorna. One alteration. |
| 3 | Bhairav | Shishya 2 | Bhairav | 7-7 | 2 (Re_k, Dha_k) | Symmetric komal swaras. Gravity. |
| 4 | Bhimpalasi | Shishya 2 | Kafi | 5-7 | 2 (Ga_k, Ni_k) | Asymmetric jati. Different komal pair. |
| 5 | Bageshri | Shishya 3 | Kafi | 5-7 | 2 (Ga_k, Ni_k) | Same thaat as Bhimpalasi. Different world. |
| 6 | Desh | Sadhaka 4 | Khamaj | 7-7 | 1 (Ni_k desc) | Mixed swaras (Ni + Ni_k). First dual-form. |
| 7 | Kafi | Sadhaka 5 | Kafi | 7-7 | 2 (Ga_k, Ni_k) | The thaat raga. Parent of Bhimpalasi/Bageshri. |
| 8 | Marwa | Varistha 7 | Marwa | 6-6 | 2 (Re_k, Ma_t) | No Pa. Fundamental instability. |
| 9 | Darbari Kanada | Varistha 7 | Asavari | 7-7 | 3 (Ga_k, Dha_k, Ni_k) | Andolan on Ga_k. Ornament as structure. |
| 10 | Puriya Dhanashri | Varistha 8 | Poorvi | 7-7 | 3 (Re_k, Ma_t, Dha_k) | Poorvi thaat. Raga distinction (vs Marwa). |
| 11 | Malkauns | Varistha 8 | Bhairavi | 5-5 | 4 (Ga_k, Dha_k, Ni_k, + no Re/Pa) | Pentatonic komal. Mirror of Bhoopali. |
| 12 | Todi | Varistha 9 | Todi | 7-7 | 4 (Re_k, Ga_k, Ma_t, Dha_k) | Maximum chromatic density. Ultimate intonation test. |
| 13 | Bhairavi | Guru 10 | Bhairavi | 7-7 | 4 (Re_k, Ga_k, Dha_k, Ni_k) | Maximum flexibility. Chhayanat. |
| 14 | Kedar | Guru 10 | Kalyan | 7-7 | Ma + Ma_t both | Dual Ma interplay. |
| 15 | Hameer | Guru 10+ | Kalyan | 7-7 | Ma + Ma_t both | Dual Ma, reversed from Kedar. |
| 16 | Sohini | Guru 10+ | Marwa | 6-6 | 2 (Re_k, Ma_t) | Pa-less, light -- vs Marwa's tension. |

### Rationale for the Complete Sequence

The sequence follows a clear arc of increasing complexity along five axes simultaneously:

1. **Swara count**: 5 (Bhoopali) then 7 (Yaman/Bhairav) then back to 5-7 (Bhimpalasi/Bageshri) then 7 (Desh/Kafi) then 6 (Marwa) then 7 (Darbari/Puriya Dhanashri) then 5 (Malkauns) then 7 (Todi/Bhairavi/Kedar/Hameer) then 6 (Sohini). The count is not strictly ascending because pentatonic ragas appear at multiple levels -- structural simplicity does not equal musical simplicity.

2. **Alteration count**: 0 then 1 then 2 then 2 then 2 then 1 then 2 then 2 then 3 then 3 then 4 then 4 then 4 then mixed then mixed then 2. Generally ascending but nonlinear.

3. **Ornamental demand**: None (Shishya) then meend/andolan/gamak introduced (Sadhaka) then ornament-as-structure (Varistha, Darbari) then ornament mastery + taan (Guru).

4. **Rhythmic integration**: None (Shishya) then tala awareness (Sadhaka) then tala-melody integration (Varistha) then bandish/taan/ektaal (Guru).

5. **Creative demand**: Imitation (Shishya) then recognition (Sadhaka) then composition (Varistha) then complete rendering + teaching (Guru).

---

## COMPLETE NEW PHASE TYPES REQUIRED

Summary of all new phase types across all levels:

| Phase Type | Level First Used | Description |
|-----------|------------------|-------------|
| `raga_identification` | Shishya (B-07) | Hear pakad, identify which raga |
| `mastery_challenge` | Shishya (B-08) | Multi-session assessment gate |
| `ornament_exercise` | Sadhaka (S-02) | Imitate ornament, trajectory evaluated |
| `swara_comparison` | Sadhaka (S-01) | Hear two forms of same swara |
| `raga_comparison` | Sadhaka (S-04) | Compare pakads from different ragas |
| `grammar_exercise` | Sadhaka (S-06) | Evaluate phrase validity in raga |
| `tala_exercise` | Sadhaka (S-05) | Rhythm awareness, clapping, singing on beat |
| `interval_exercise` | Sadhaka (S-09) | Identify interval between swaras |
| `raga_comparison_advanced` | Varistha (V-02) | Deep comparison of related ragas |
| `composition_exercise` | Varistha (V-04) | Student creates phrases, engine validates |
| `ornament_context_exercise` | Varistha (V-06) | Apply correct ornament in correct context |
| `shruti_exercise` | Varistha (V-08) | Distinguish shruti variants |
| `tala_melody_exercise` | Varistha (V-10) | Sing melody aligned to tala |
| `raga_identification_advanced` | Guru (G-01) | Identify from extended phrases with ornaments |
| `bandish_exercise` | Guru (G-02) | Learn and compose bandish |
| `controlled_deviation` | Guru (G-03) | Introduce foreign swaras under guidance |
| `modulation_awareness` | Guru (G-04) | Identify raga transitions |
| `taan_exercise` | Guru (G-05) | Rapid sargam runs at speed |
| `raga_rendering` | Guru (G-08) | Complete alap-jod-jhala exposition |
| `teaching_exercise` | Guru (G-09) | Demonstrate mastery by "teaching" a raga |

---

## ENGINE DEFINITIONS NEEDED

New raga files to create in `engine/theory/ragas/`:
1. `desh.ts` -- Khamaj thaat, mixed Ni
2. `kafi.ts` -- Kafi thaat, the parent raga
3. `marwa.ts` -- Marwa thaat, no Pa
4. `darbari_kanada.ts` -- Asavari thaat, andolan on Ga_k
5. `puriya_dhanashri.ts` -- Poorvi thaat
6. `malkauns.ts` -- Bhairavi thaat, pentatonic komal
7. `todi.ts` -- Todi thaat
8. `bhairavi.ts` -- Bhairavi thaat, flexible
9. `kedar.ts` -- Kalyan thaat, dual Ma
10. `hameer.ts` -- Kalyan thaat, dual Ma reversed
11. `sohini.ts` -- Marwa thaat, no Pa, light

Each must follow the Raga interface in `engine/theory/types.ts` with complete aroha, avaroha, vadi, samvadi, anuvadi, varjit, pakad, prahara, rasa, ornaments, description, westernBridge, relatedRagas, and gharanaVariations.

---

## CULTURAL FLAGS FOR RAGA-SCHOLAR VALIDATION

1. **Marwa Pa treatment**: Some traditions allow a very faint Pa as a passing tone. The curriculum treats Pa as omitted (varjit). Raga-scholar should confirm whether this is the correct treatment for a pedagogical context.

2. **Darbari Ga_k andolan**: The amplitude range I have specified (30-50 cents) is based on Kirana gharana treatment. Agra gharana may use wider andolan. Raga-scholar should validate the range for our detection parameters.

3. **Bhairavi chhayanat**: The Guru-level exercise allowing "foreign" swaras in Bhairavi needs careful validation. Which swaras are acceptable as chhayanat and which cross into a different raga entirely?

4. **Puriya Dhanashri vadi**: I have given Ma_t as vadi following the majority tradition. Some texts give Ga. Raga-scholar should confirm.

5. **Desh Ni treatment**: Some traditions treat Desh as using both Ni and Ni_k freely (not strictly shuddha in aroha, komal in avaroha). The curriculum presents the cleaner aroha-shuddha/avaroha-komal model for pedagogical clarity. Raga-scholar should validate whether this simplification is acceptable.

6. **Kafi Re treatment**: I have given Pa as vadi following the dominant tradition. Some Banaras gharana musicians give Re as vadi. Raga-scholar should confirm.

7. **Todi aroha vakra**: Some traditions use a strongly vakra aroha (S r g r S, g M P d N S'). The curriculum uses the simpler straight aroha for initial teaching. Raga-scholar should validate.

8. **Hameer aroha Ma**: Hameer's use of shuddha Ma in aroha despite being a Kalyan thaat raga is unusual. This is a key teaching point but needs careful musicological validation.

---

## SUMMARY OF DELIVERABLES

**For curriculum-designer (YAML structuring):**
- 3 new Shishya lessons (B-06, B-07, B-08)
- 10 Sadhaka lessons (S-01 through S-10)
- 11 Varistha lessons (V-01 through V-11)
- 10 Guru exercises (G-01 through G-10)
- Total: 34 new lessons/exercises
- 20 new phase types to define

**For acoustics-engineer (engine definitions):**
- 11 new raga files
- Ornament detection parameters for meend trajectory, andolan amplitude/rate, gamak amplitude/rate
- Shruti variant parameters for shruti_exercise phase type

**For raga-scholar (validation):**
- 8 cultural flags listed above
- All 11 new raga definitions need musicological sign-off
- Ornament-swara-raga associations need validation

**For audio-engineer (Tantri):**
- Progressive disclosure specifications per level
- Ornament visualization on strings (andolan = gentle oscillation of string, gamak = vigorous oscillation, meend = smooth transition between strings)
- All 12 strings visible at Varistha+

**For frontend-builder:**
- 20 new phase type components
- Mastery challenge multi-session tracking UI
- Tala visualization (beat cycle with sam/khali markers)
- Raga comparison side-by-side view
- Composition mode (free singing with grammar feedback overlay)

---

NEXT: curriculum-designer to structure YAML for all 34 lessons, starting with B-06 (Bageshri) and B-07 (Consolidation). Raga-scholar to validate all cultural flags. Acoustics-engineer to begin engine definitions for Desh and Kafi (Sadhaka ragas needed first).