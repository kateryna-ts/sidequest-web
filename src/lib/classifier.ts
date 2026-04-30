// Ported from sidequest/lib/instagramPipeline.ts — must stay in sync with 005_taste_fingerprints.sql vector(74)
const DIMENSION_ORDER = [
  'cooking', 'baking', 'chaotic_cooking', 'coffee_culture', 'cocktails',
  'healthy_eating', 'food_travel', 'restaurant', 'gym', 'running',
  'yoga_pilates', 'sports', 'wellness', 'fitness_motivation', 'travel',
  'hiking', 'luxury_travel', 'solo_travel', 'van_life', 'city_guides',
  'interior_design', 'diy', 'minimalism', 'cottagecore', 'plants',
  'organization', 'fashion', 'vintage_fashion', 'streetwear', 'luxury_fashion',
  'sustainable_fashion', 'beauty_makeup', 'skincare', 'film', 'tv_series',
  'anime', 'true_crime', 'books', 'music', 'music_production',
  'live_music', 'vinyl', 'hip_hop', 'indie_music', 'art',
  'digital_art', 'photography', 'film_photography', 'poetry_writing', 'dry_humor',
  'dark_humor', 'memes', 'skits', 'absurdist', 'ai_tools',
  'tech', 'coding', 'crypto_web3', 'dogs', 'cats',
  'wildlife', 'nature', 'sustainability', 'stargazing', 'entrepreneurship',
  'productivity', 'finance', 'student_life', 'dating', 'friendship',
  'self_love', 'culture', 'history', 'social_commentary',
] as const;

const CATEGORIES: Record<string, string[]> = {
  cooking: ['recipe', 'cooking', 'homecook', 'chef', 'kitchen', 'meal prep', 'food', 'foodie', 'tasty', 'delicious', 'yummy', 'dinner', 'lunch', 'breakfast', 'ingredients', 'dish', 'plate', 'cook with me'],
  baking: ['baking', 'cake', 'cookies', 'bread', 'pastry', 'sourdough', 'dessert', 'sweets', 'bakery', 'frosting', 'dough', 'croissant'],
  chaotic_cooking: ['chaos', 'failed recipe', 'cooking fail', 'gordon ramsay', 'this went wrong', 'not a chef', 'amateur cook', 'i tried', 'disaster meal'],
  coffee_culture: ['coffee', 'espresso', 'latte', 'matcha', 'cafe', 'barista', 'pour over', 'cold brew', 'coffee shop', 'caffeine', 'morning coffee'],
  cocktails: ['cocktail', 'drinks', 'mixology', 'bartender', 'wine', 'beer', 'spirits', 'happy hour', 'bar', 'whiskey', 'tequila', 'aperol'],
  healthy_eating: ['healthy', 'nutrition', 'whole foods', 'clean eating', 'salad', 'smoothie', 'vegan', 'plant based', 'gluten free', 'meal plan'],
  food_travel: ['street food', 'local food', 'food tour', 'best restaurants', 'hidden gem restaurant', 'food market', 'trying local', 'food destination'],
  restaurant: ['restaurant review', 'foodie find', 'date night dinner', 'brunch', 'omakase', 'tasting menu', 'michelin', 'hole in the wall'],
  gym: ['gym', 'workout', 'lifting', 'gains', 'PR', 'personal record', 'weight training', 'bodybuilding', 'pump', 'sets and reps', 'bulk', 'cut'],
  running: ['running', 'marathon', '5k', '10k', 'trail run', 'race day', 'runner', 'jogging', 'pace', 'miles', 'cross country'],
  yoga_pilates: ['yoga', 'pilates', 'mindful movement', 'flexibility', 'mat workout', 'flow', 'breathwork', 'stretch', 'core', 'balance'],
  sports: ['sports', 'basketball', 'football', 'soccer', 'tennis', 'baseball', 'swimming', 'volleyball', 'sport hype', 'game day', 'athlete'],
  wellness: ['wellness', 'mental health', 'self care', 'mindfulness', 'meditation', 'journaling', 'therapy', 'burnout', 'healing', 'rest'],
  fitness_motivation: ['fitness motivation', 'transformation', 'progress', 'consistency', 'discipline', 'grind', 'no days off', 'fit check'],
  travel: ['travel', 'wanderlust', 'explore', 'adventure', 'trip', 'vacation', 'abroad', 'destination', 'travel diary', 'passport', 'tourist'],
  hiking: ['hiking', 'trail', 'summit', 'mountain', 'backpacking', 'outdoor', 'national park', 'wilderness', 'camping', 'nature walk', 'boots'],
  luxury_travel: ['luxury travel', '5 star', 'resort', 'first class', 'business class', 'suite', 'overwater bungalow', 'private villa'],
  solo_travel: ['solo travel', 'traveling alone', 'solo trip', 'solo female', 'backpacker', 'hostel', 'one bag travel', 'nomad'],
  van_life: ['van life', 'road trip', 'van build', 'camper van', 'rv life', 'living in a van', 'overlanding', 'car camping'],
  city_guides: ['city guide', 'things to do in', 'weekend in', 'hidden gems', 'local spots', 'neighborhood guide', 'travel tips', 'itinerary'],
  interior_design: ['interior design', 'home decor', 'room makeover', 'aesthetic', 'apartment tour', 'home tour', 'design inspo', 'furniture', 'IKEA', 'thrift flip', 'home transformation', 'room reveal'],
  diy: ['DIY', 'do it yourself', 'home improvement', 'renovation', 'before and after', 'built this', 'made this', 'upcycle', 'repurpose', 'handmade'],
  minimalism: ['minimalism', 'minimal', 'declutter', 'less is more', 'capsule', 'intentional living', 'simple living', 'clean space'],
  cottagecore: ['cottagecore', 'cozy', 'cottage', 'fairycore', 'dark academia', 'goblincore', 'whimsical', 'vintage home', 'thrifted finds'],
  plants: ['plants', 'houseplants', 'garden', 'gardening', 'plant parent', 'propagation', 'monstera', 'succulents', 'botanical', 'urban garden'],
  organization: ['organization', 'clean with me', 'organize', 'declutter', 'storage solutions', 'tidy', 'cleaning routine', 'deep clean'],
  fashion: ['fashion', 'outfit', 'ootd', 'style', 'clothing', 'look', 'what i wear', 'fashion inspo', 'trend', 'seasonal style'],
  vintage_fashion: ['vintage', 'thrift', 'secondhand', 'thrifted', 'preloved', 'charity shop', 'vintage finds', 'retro', 'old money', 'classic style'],
  streetwear: ['streetwear', 'sneakers', 'hype', 'drops', 'grails', 'kicks', 'sneaker collection', 'street style', 'urban fashion'],
  luxury_fashion: ['luxury', 'designer', 'high fashion', 'couture', 'brand', 'investment piece', 'luxury haul', 'fashion week'],
  sustainable_fashion: ['sustainable fashion', 'slow fashion', 'ethical', 'eco fashion', 'conscious consumer', 'capsule wardrobe', 'buy less'],
  beauty_makeup: ['makeup', 'beauty', 'glam', 'GRWM', 'get ready with me', 'foundation', 'eyeshadow', 'lip liner', 'contour', 'beauty routine'],
  skincare: ['skincare', 'skin', 'routine', 'SPF', 'retinol', 'moisturizer', 'glow', 'skin care', 'dermatology', 'acne', 'serum', 'toner'],
  film: ['film', 'movie', 'cinema', 'director', 'cinematography', 'scene', 'letterboxd', 'filmtok', 'movie review', 'cult classic', 'film buff', 'screenplay'],
  tv_series: ['series', 'show', 'tv', 'binge watch', 'streaming', 'netflix', 'hbo', 'episode', 'season', 'finale', 'plot twist', 'character'],
  anime: ['anime', 'manga', 'otaku', 'weeb', 'japanese animation', 'studio ghibli', 'shonen', 'seinen', 'cosplay', 'figure collection'],
  true_crime: ['true crime', 'crime', 'documentary', 'cold case', 'mystery', 'unsolved', 'detective', 'criminal', 'investigation'],
  books: ['book', 'reading', 'novel', 'author', 'booktok', 'bookstagram', 'library', 'chapter', 'literature', 'fiction', 'nonfiction', 'currently reading', 'book review', 'page turner'],
  music: ['music', 'song', 'artist', 'album', 'playlist', 'lyrics', 'new music', 'music video', 'track', 'release', 'listen'],
  music_production: ['music production', 'producer', 'beat', 'DAW', 'studio session', 'fl studio', 'ableton', 'sample', 'mixing', 'mastering', 'bedroom producer'],
  live_music: ['concert', 'live music', 'festival', 'show', 'setlist', 'venue', 'mosh pit', 'front row', 'tour', 'gig'],
  vinyl: ['vinyl', 'record', 'turntable', 'record collection', 'crate digging', 'pressing', 'LP', 'album art', 'discogs'],
  hip_hop: ['hip hop', 'rap', 'rapper', 'bars', 'freestyle', 'drill', 'trap', 'boom bap', 'lyricism', 'flow'],
  indie_music: ['indie', 'indie music', 'alternative', 'shoegaze', 'bedroom pop', 'lo fi', 'folk', 'singer songwriter', 'acoustic'],
  art: ['art', 'artwork', 'painting', 'illustration', 'draw', 'sketch', 'creative', 'artist', 'gallery', 'exhibition', 'studio'],
  digital_art: ['digital art', 'procreate', 'graphic design', 'illustration', 'ui design', 'motion graphics', '3D art', 'render', 'concept art'],
  photography: ['photography', 'photographer', 'photo', 'shot on', 'golden hour', 'portrait', 'street photography', 'landscape', 'edit', 'lightroom', 'preset', 'composition'],
  film_photography: ['film photography', '35mm', 'analog', 'kodak', 'fuji', 'grain', 'darkroom', 'disposable camera', 'point and shoot'],
  poetry_writing: ['poetry', 'poem', 'prose', 'writing', 'creative writing', 'spoken word', 'writer', 'short story', 'journal', 'words'],
  dry_humor: ['no because', 'the way', "i'm crying", 'not me', 'bestie', 'genuinely', 'lowkey', 'i cannot', 'this is sending me', "i'm dead", 'why is this so accurate', 'POV:', 'tell me why'],
  dark_humor: ['dark humor', 'too soon', 'wrong for laughing', 'morbid', 'dead inside', 'cursed', 'unhinged', 'chaotic', 'deranged'],
  memes: ['meme', 'relatable', 'this is me', 'anyone else', 'raise your hand', 'tag someone', 'this hits different', 'real', 'so true'],
  skits: ['skit', 'comedy', 'funny video', 'bit', 'sketch', 'parody', 'impression', 'character', 'acting', 'roleplay video'],
  absurdist: ['absurd', 'random', 'makes no sense', 'what is this', 'unhinged energy', 'chaotic good', 'fever dream', 'why does this exist'],
  ai_tools: ['AI', 'artificial intelligence', 'chatgpt', 'claude', 'machine learning', 'prompt', 'AI tools', 'automation', 'AI art', 'generative AI'],
  tech: ['tech', 'technology', 'gadget', 'review', 'unboxing', 'setup', 'desk setup', 'workspace', 'productivity tools', 'app recommendation'],
  coding: ['coding', 'programming', 'developer', 'software', 'code', 'build', 'github', 'hackathon', 'startup', 'side project', 'launch'],
  crypto_web3: ['crypto', 'bitcoin', 'ethereum', 'NFT', 'web3', 'blockchain', 'defi', 'token', 'wallet', 'trading'],
  dogs: ['dog', 'puppy', 'pup', 'doggo', 'golden retriever', 'rescue dog', 'dog mom', 'dog dad', 'training', 'dog park', 'woof'],
  cats: ['cat', 'kitten', 'kitty', 'meow', 'cat mom', 'cat dad', 'feline', 'cat behavior', 'indoor cat', 'cat rescue'],
  wildlife: ['wildlife', 'nature', 'animals', 'bird watching', 'safari', 'ocean life', 'marine biology', 'conservation', 'endangered'],
  nature: ['nature', 'outdoors', 'forest', 'woods', 'trees', 'landscape', 'sunset', 'sunrise', 'sky', 'clouds', 'stars', 'moon'],
  sustainability: ['sustainability', 'eco', 'environment', 'climate', 'green living', 'zero waste', 'compost', 'renewable', 'carbon footprint'],
  stargazing: ['stars', 'astronomy', 'space', 'milky way', 'telescope', 'astrophotography', 'galaxy', 'planets', 'nasa'],
  entrepreneurship: ['entrepreneur', 'startup', 'founder', 'business', 'hustle', 'build', 'product', 'launch', 'scale', 'investor'],
  productivity: ['productivity', 'routine', 'morning routine', 'habit', 'discipline', 'focus', 'deep work', 'time management', 'goals'],
  finance: ['finance', 'investing', 'stocks', 'budget', 'saving money', 'financial freedom', 'passive income', 'wealth', 'frugal'],
  student_life: ['student', 'college', 'university', 'study', 'exam', 'campus', 'dorm', 'grad school', 'academic', 'study with me'],
  dating: ['dating', 'situationship', 'talking stage', 'red flags', 'green flags', 'rizz', 'dating advice', 'relationship', 'crush', 'dating app', 'first date', 'love language'],
  friendship: ['friendship', 'best friend', 'girls trip', 'boys trip', 'friendship goals', 'found family', 'roommates', 'college friends'],
  self_love: ['self love', 'confidence', 'glow up', 'self improvement', 'boundaries', 'healing era', 'unbothered', 'main character'],
  culture: ['culture', 'heritage', 'tradition', 'identity', 'diaspora', 'cultural', 'roots', 'language', 'community'],
  history: ['history', 'historical', 'did you know', 'fun fact', 'ancient', 'war', 'civilization', 'documentary', 'archive'],
  social_commentary: ['hot take', 'unpopular opinion', "let's talk about", 'this needs to be said', 'opinion', 'discourse', 'perspective'],
};

function classifyPost(caption: string, hashtags: string[]): Record<string, number> {
  const text = `${caption} ${hashtags.join(' ')}`.toLowerCase();
  const scores: Record<string, number> = {};
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    const hits = keywords.filter(kw => text.includes(kw.toLowerCase())).length;
    if (hits > 0) scores[category] = Math.min(hits / 3, 1);
  }
  return scores;
}

function toVector(scores: Record<string, number>): number[] {
  return DIMENSION_ORDER.map(dim => scores[dim] ?? 0);
}

export interface InstagramPost {
  caption: string;
  hashtags: string[];
}

export function buildFingerprintVector(posts: InstagramPost[]): number[] {
  const merged: Record<string, number> = {};
  for (const post of posts) {
    const scores = classifyPost(post.caption, post.hashtags);
    for (const [cat, score] of Object.entries(scores)) {
      merged[cat] = merged[cat] !== undefined ? Math.max(merged[cat], score) : score;
    }
  }
  return toVector(merged);
}
