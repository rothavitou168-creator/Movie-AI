import { SampleMovie, VoiceActorProfile } from '../types/dubbing';

export const VOICE_ACTORS: VoiceActorProfile[] = [
  {
    id: 'dara',
    name: 'Dara (តារា)',
    khmerName: 'តួប្រុសកណ្តាល (Heroic / Lead)',
    gender: 'male',
    tone: 'Heroic, determined, clear resonance',
    avatarColor: 'from-amber-500 to-amber-700',
    ttsVoice: 'Fenrir',
  },
  {
    id: 'bopha',
    name: 'Bopha (បុប្ផា)',
    khmerName: 'តួស្រីមនោសញ្ចេតនា (Emotional Female Lead)',
    gender: 'female',
    tone: 'Warm, expressive, high emotional depth',
    avatarColor: 'from-rose-500 to-pink-700',
    ttsVoice: 'Kore',
  },
  {
    id: 'sokha',
    name: 'Sokha (សុខា)',
    khmerName: 'តួប្រុសកាច/កំប្លែង (Edgy / Antagonist / Action)',
    gender: 'male',
    tone: 'Deep, fierce, intense gravelly punch',
    avatarColor: 'from-orange-500 to-red-700',
    ttsVoice: 'Puck',
  },
  {
    id: 'chenda',
    name: 'Chenda (ចិន្តា)',
    khmerName: 'តួស្រីម៉ឺងម៉ាត់ (Commanding / Mystery Female)',
    gender: 'female',
    tone: 'Crisp, resolute, fast tempo',
    avatarColor: 'from-cyan-500 to-blue-700',
    ttsVoice: 'Zephyr',
  },
];

export const SAMPLE_MOVIES: SampleMovie[] = [
  {
    id: 'cyberpunk-heist',
    title: 'Cyber Heist: Phnom Penh 2088',
    khmerTitle: 'ប្រតិបត្តិការចោរកម្មបច្ចេកវិទ្យា ២០៨៨',
    genre: 'Sci-Fi / Cyberpunk',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    duration: 734,
    description: 'High-tech thriller involving neural data couriers and a frantic chase through neon-lit streets.',
    sampleScript: `1
00:00:01,500 --> 00:00:04,800
DARA: Look at the sky! They've already bypassed the defensive grid!

2
00:00:05,200 --> 00:00:09,200
SOPHEA: Keep your voice down. If the drones scan our neural signatures, we're finished.

3
00:00:10,000 --> 00:00:14,800
DARA: There is no time to hide! The mainframe is overriding the emergency blast doors right now!

4
00:00:15,500 --> 00:00:19,800
SOPHEA: Trust me for once. Hold my hand, and don't look back whatever happens!

5
00:00:20,400 --> 00:00:25,200
COMMANDER: All strike units, target acquired in sector seven. Terminate without hesitation!

6
00:00:26,000 --> 00:00:30,000
DARA: Run! Get to the extraction shuttle immediately!`,
  },
  {
    id: 'epic-kingdom',
    title: 'The Royal Oath: Empire of Gold',
    khmerTitle: 'សច្ចាប្រណិធានរាជបល្ល័ង្កមាស',
    genre: 'Historical / Epic',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    duration: 653,
    description: 'A tense showdown in the sacred palace hall over royal loyalty and hidden secrets.',
    sampleScript: `1
00:00:02,000 --> 00:00:06,800
GENERAL MONI: Your Majesty, the northern garrison has breached the river crossing at dawn.

2
00:00:07,400 --> 00:00:12,000
PRINCESS TEP: Why did you keep this secret from the Royal Council until now?!

3
00:00:12,800 --> 00:00:17,500
GENERAL MONI: Forgive me, My Lady... treason walks among our closest advisors.

4
00:00:18,200 --> 00:00:23,200
PRINCESS TEP: Then let them face the ancestral blade. We shall defend our homeland with honor!

5
00:00:24,000 --> 00:00:28,500
WARRIOR: The war drums are echoing across the valley! Prepare the frontline!`,
  },
  {
    id: 'action-chase',
    title: 'Velocity Midnight: Extreme Pursuit',
    khmerTitle: 'ការតាមប្រមាញ់កណ្តាលអធ្រាត្រ',
    genre: 'Action Thriller',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    duration: 596,
    description: 'A relentless chase sequence with screeching tires and life-or-death confrontation.',
    sampleScript: `1
00:00:01,800 --> 00:00:05,000
AGENT CHEN: Step on the gas! They're coming up on our blind spot!

2
00:00:05,500 --> 00:00:09,000
DRIVER: The brakes aren't responding! Someone cut the hydraulic lines!

3
00:00:09,600 --> 00:00:13,800
AGENT CHEN: Hang on tight! I'm taking out their front tire!

4
00:00:14,200 --> 00:00:18,500
PURSUER: Pull over immediately! You have nowhere left to run!

5
00:00:19,000 --> 00:00:23,000
AGENT CHEN: Never! Not while I still breathe!`,
  },
];
