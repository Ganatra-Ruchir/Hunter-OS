// Genres are multi-label. Existing saved genre values remain valid as a fallback.
export const GENRES={
 books:['Manga & Comics','Dark Romance & Smut','Romance','Fantasy','Science Fiction','Mystery & Thriller','Crime & Detective','Horror','Historical Fiction','Literary Fiction','Classics','Poetry','Biography & Memoir','Personal Growth','Psychology','Philosophy','Business & Finance','Technology & AI','Science','History & Politics','Mythology & Folklore','Young Adult','Adventure','Nonfiction','Other Books'],
 anime:['Action','Adventure','Fantasy','Isekai','Romance','Romantic Comedy','Comedy','Drama','Slice of Life','Psychological','Mystery','Thriller','Horror','Supernatural','Sci-Fi','Cyberpunk','Mecha','Sports','Music','School','Historical','Martial Arts','Shounen','Shoujo','Seinen','Josei','Other Anime'],
 drama:['Romance','Romantic Comedy','Melodrama','Comedy','Slice of Life','Family','Youth & School','Historical & Sageuk','Fantasy','Supernatural','Sci-Fi','Action','Thriller','Crime & Detective','Mystery','Legal & Courtroom','Medical','Workplace','Political','Revenge','Horror','Psychological','Reality & Variety','Other Series'],
 hentai:['Adult','Adult Fantasy','Adult Romance','Adult Comedy','Adult Drama','Other Adult']
};
const ALIASES={
 'romance & fiction':'Romance','romance & smut':'Dark Romance & Smut','fiction':'Literary Fiction','fantasy & sci-fi':'Fantasy','manga':'Manga & Comics','graphic novel':'Manga & Comics','action & adventure':'Action','sci-fi':'Sci-Fi','science fiction':'Science Fiction','super power':'Supernatural','supernatural power':'Supernatural','school life':'School','slice of life':'Slice of Life','historical':'Historical & Sageuk','detective':'Crime & Detective','crime':'Crime & Detective','medical drama':'Medical','rom-com':'Romantic Comedy','romcom':'Romantic Comedy','business':'Business & Finance','self-help':'Personal Growth','psychological thriller':'Psychological','sports':'Sports'
};
function canonical(raw,kind){const original=String(raw||'').trim();if(!original)return '';const list=GENRES[kind]||[];const direct=list.find(x=>x.toLowerCase()===original.toLowerCase());if(direct)return direct;const alias=ALIASES[original.toLowerCase()];return alias&&list.includes(alias)?alias:''}
function inferBook(x){
 const t=[x.title,x.author,...(x.subjects||[]),...(x.genres||[])].filter(Boolean).join(' ').toLowerCase();
 const rules=[['Manga & Comics',/manga|graphic novel|comic|jujutsu|naruto|tokyo ghoul|pokemon adventures/],['Dark Romance & Smut',/dark romance|smut|erotic|adeline|twisted (love|games|hate|lies)|lights out/],['Technology & AI',/artificial intelligence|machine learning|programming|software|computing/],['Personal Growth',/self.help|self-help|habit|productivity|motivation|mindset|personal growth|psychology of money|discipline/],['Psychology',/psychology|mental health|cognition|behavio(u)?r|neuroscience/],['Philosophy',/philosophy|stoic|existentialism|ethic/],['Business & Finance',/business|invest|money|entrepreneur|finance|economics/],['Mythology & Folklore',/mythology|folklore|puran|hindu myth|gods|legends/],['Mystery & Thriller',/mystery|thriller|suspense|sherlock holmes/],['Crime & Detective',/detective|crime|murder|investigation/],['Science Fiction',/science fiction|sci-fi|dystopi|space opera/],['Fantasy',/fantasy|magic|dragon|wizard/],['Horror',/horror|ghost|haunted|gothic/],['Historical Fiction',/historical fiction/],['Biography & Memoir',/biograph|memoir|autobiograph/],['Poetry',/poetry|poems|verse/],['Classics',/classic|fyodor dostoevsky|franz kafka|sherlock holmes/],['Romance',/romance|love story|colleen hoover|ana huang/],['History & Politics',/history|politics|political/],['Science',/science|physics|biology|astronomy/],['Adventure',/adventure|journey|exploration/],['Literary Fiction',/fiction|novel|literature/]];
 return rules.filter(([name,re])=>re.test(t)).map(([name])=>name);
}
export function titleGenres(item,kind){
 if(kind==='hentai')return ['Adult'];
 const provided=[...(Array.isArray(item.genres)?item.genres:[]),...(Array.isArray(item.categories)?item.categories:[])];
 const mapped=provided.map(g=>canonical(g,kind)).filter(Boolean);
 const inferred=kind==='books'?inferBook(item):[];
 const legacy=canonical(item.genre,kind);
 const result=[...new Set([...mapped,...inferred,...(legacy?[legacy]:[])])];
 return result.length?result:[kind==='books'?'Other Books':kind==='drama'?'Other Series':'Other Anime'];
}
export function genreOptions(items,kind){
 const used=new Set(items.flatMap(item=>titleGenres(item,kind)));
 return (GENRES[kind]||[]).filter(name=>used.has(name));
}
