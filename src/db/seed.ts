import { DEFAULT_JOURNAL_COLOR } from '@/constants/journal-icons';
import { emotionRecords, entries, journals, weatherRecords } from '@/db/schema';
import type { Db } from '@/db/types';
import { getRawClient } from '@/db/types';
import { ONE_DAY_MS } from '@/utils/date';
import { generateId } from '@/utils/id';

/**
 * Ensures a default "Daily" journal exists.
 * Uses raw SQL with a conditional insert to stay idempotent.
 */
export function ensureDefaultJournal(db: Db): void {
	const raw = getRawClient(db);
	const now = Date.now();

	const existing = raw.getAllSync(`SELECT id FROM journal WHERE name = ? LIMIT 1`, ['Daily']);

	if (existing.length > 0) return;

	raw.runSync(
		`INSERT INTO journal (id, name, icon, color, display_order, created_at, updated_at)
     VALUES (?, 'Daily', 'book-open', ?, 0, ?, ?)`,
		[generateId(), DEFAULT_JOURNAL_COLOR, now, now],
	);
}

const MOCK_JOURNALS = [
	{
		name: 'Daily',
		icon: 'book-open',
		color: '#7A8A8C',
		entries: [
			{
				daysAgo: 0,
				text: 'Walked the long way along the river before work. The light was that flat early-spring grey that makes everything look like a photograph from the seventies. A heron was standing in the shallows, completely still, and I stopped and watched it for what must have been five minutes. I can\u2019t remember the last time I stood somewhere without reaching for my phone. By the time I got to the office I felt like I\u2019d already lived a small day before the day had started.',
				weather: { temperature: 14, condition: 'Mainly Clear', humidity: 62, windSpeed: 8 },
				emotions: [{ category: 'content', intensity: 4 }],
			},
			{
				daysAgo: 1,
				text: 'Finished the draft at some point after eleven, stared at it for another half hour, and sent it without rereading. It\u2019s not good, not yet, but it exists, and that is the single hardest transformation — from nothing to something you can argue with. I have spent the whole week telling myself that perfectionism is just fear wearing a nicer coat, and tonight I finally believed it enough to hit send. Ordered ramen, ate it on the floor, felt the particular kind of tired that comes from finishing a thing.',
				weather: { temperature: 18, condition: 'Overcast', humidity: 70, windSpeed: 12 },
				emotions: [{ category: 'proud', intensity: 3 }],
			},
			{
				daysAgo: 2,
				text: 'Cooked a proper dinner for the first time in what feels like a month — pasta with brown butter and sage, a salad that existed mostly as an alibi. Put the phone in the other room on purpose, which felt absurd until halfway through, when I noticed I was actually tasting the food. There\u2019s a version of me that doesn\u2019t know how to sit at a table for half an hour without being entertained, and I\u2019d like to phase him out.',
				weather: {
					temperature: 16,
					condition: 'Partly Cloudy',
					humidity: 65,
					windSpeed: 10,
				},
				emotions: [{ category: 'content', intensity: 4 }],
			},
			{
				daysAgo: 3,
				text: 'M. called out of nowhere. We hadn\u2019t spoken in — I want to say eight months, maybe longer, long enough that I\u2019d started to wonder if I\u2019d done something without realizing. She was driving back from her mother\u2019s and needed a voice that wasn\u2019t the radio, and we talked for the entire length of the freeway. Nothing important. Her new dog, a book I should read, a stupid thing her coworker said in a meeting. I\u2019d forgotten how much of friendship is just the low hum of being known by someone.',
				emotions: [{ category: 'compassionate', intensity: 5 }],
			},
			{
				daysAgo: 5,
				text: 'Grocery run went sideways. Made a list, forgot the list, reconstructed it from memory, still missed the one thing I actually went for (onions). Stood in the produce section for a full minute trying to remember if it was onions or oranges and bought both to cover my bases. The man at the checkout asked if I was having a party. No, I said, I\u2019m having a weekday.',
				weather: { temperature: 12, condition: 'Slight Rain', humidity: 80, windSpeed: 15 },
				emotions: [{ category: 'amazed', intensity: 2 }],
			},
			{
				daysAgo: 7,
				text: 'Rough day. The kind where nothing is actually wrong but everything feels like it\u2019s running one gear too low. Got through the meetings, answered the emails, ate lunch at my desk and didn\u2019t really taste it. Skipped the gym, which I\u2019m trying not to narrate as a failure. Some days the quiet victory is just not making things worse. Tomorrow is another try.',
				weather: {
					temperature: 9,
					condition: 'Moderate Rain',
					humidity: 88,
					windSpeed: 22,
				},
				emotions: [{ category: 'tired', intensity: 4 }],
			},
			{
				daysAgo: 10,
				text: 'Took an hour in the middle of the afternoon and sat in the park with a coffee and did absolutely nothing. No book, no phone, no agenda. Just watched a man teach a toddler how to kick a ball and a dog sprint in wide stupid circles for no reason anyone could identify. It felt scandalous at first, like I was stealing from some imaginary employer who expected my attention at every waking moment. By the time the coffee was gone I\u2019d remembered that rest isn\u2019t a reward, it\u2019s a precondition.',
				weather: { temperature: 20, condition: 'Clear Sky', humidity: 50, windSpeed: 6 },
				emotions: [{ category: 'content', intensity: 5 }],
			},
			{
				daysAgo: 14,
				text: 'Laundry, dishes, three loads of emails, a bill I\u2019d been avoiding because opening it felt worse than paying it. The unglamorous scaffolding of a life, and it all still has to be done by someone, and that someone is, for better or worse, me. Tried to make it feel like a meditation. Mostly it just felt like laundry.',
				emotions: [{ category: 'apathetic', intensity: 2 }],
			},
		],
	},
	{
		name: 'Work',
		icon: 'briefcase',
		color: '#8C7A6B',
		entries: [
			{
				daysAgo: 0,
				text: 'Shipped the refactor. Two weeks of quiet, head-down slog, fourteen commits squashed into one, and the whole thing goes out in a PR that reads like a tidy eight-line cleanup. Nobody will ever know what it actually cost — the three afternoons where I was convinced I\u2019d broken something load-bearing, the one night I deleted it all and rewrote from scratch. That\u2019s the work though. Most of the good engineering I\u2019ve done in my career is invisible by design.',
				emotions: [{ category: 'proud', intensity: 4 }],
			},
			{
				daysAgo: 1,
				text: 'Standup ran forty-five minutes again. It\u2019s supposed to be fifteen. We\u2019re eight people, so that\u2019s five person-hours a day, twenty-five a week, spent narrating work instead of doing it. I\u2019m going to push back on the format on Monday. Not with a manifesto, just a question: what would we lose if we did this async for a week? If nobody has a real answer, we have our answer.',
				emotions: [{ category: 'frustrated', intensity: 3 }],
			},
			{
				daysAgo: 4,
				text: 'Interviewed the senior candidate this afternoon. Sharp in a way that was immediately obvious but never performative — the kind of person who asks you a clarifying question and you realize halfway through your answer that you hadn\u2019t actually thought about it that clearly. She pushed back on one of my framings and was right to. Left the room genuinely hoping we hire her and slightly nervous about working with someone that good.',
				emotions: [{ category: 'excited', intensity: 4 }],
			},
			{
				daysAgo: 6,
				text: 'Paired with J. for three straight hours on the ingestion pipeline. I learned more in those three hours than in the last month of independent work — not because the problem was hard, but because watching someone else\u2019s process is the only real way to notice the shortcuts you\u2019ve stopped questioning. He kept asking "why is it like that" about things I\u2019d accepted as load-bearing scenery. Half of them turned out not to be.',
				emotions: [{ category: 'curious', intensity: 5 }],
			},
			{
				daysAgo: 9,
				text: 'Production incident at 2:47 pm. Error rate spiked on the billing service, the graph went vertical, my stomach did the thing. Turned out to be a stale config flag that had been toggled in a Slack thread six hours earlier by someone on a different team. Fixed it in twenty minutes. The adrenaline took the rest of the day. I\u2019m writing this at ten and I still don\u2019t feel normal. There has to be a better way to propagate that kind of change.',
				emotions: [{ category: 'stressed', intensity: 4 }],
			},
			{
				daysAgo: 13,
				text: 'Quarterly review. My manager was generous in a way that felt specific rather than rehearsed — she referenced things I\u2019d done that I\u2019d assumed had been forgotten. My instinct was to deflect, to catalogue everything I\u2019d done poorly, to balance the ledger. I caught myself doing it and made myself just say thank you. Sat with the feedback on the walk home. It\u2019s uncomfortable to be seen clearly, even well.',
				emotions: [{ category: 'proud', intensity: 3 }],
			},
			{
				daysAgo: 18,
				text: 'Calendar was stacked seven meetings deep. Between them I had exactly four-minute windows, which is enough time to feel harried but not enough to do any actual work. By four o\u2019clock I\u2019d been talking about the work for six hours without touching it. Came home, opened the laptop, and discovered I\u2019d forgotten where half the threads were. This is the failure mode nobody warns you about at promotion time — you stop being someone who does things and start being someone who coordinates doing things.',
				emotions: [{ category: 'frustrated', intensity: 4 }],
			},
		],
	},
	{
		name: 'Travel',
		icon: 'plane',
		color: '#48A5D9',
		entries: [
			{
				daysAgo: 14,
				text: 'First day in Lisbon and I am already scheming to come back. Yellow trams groaning up impossible hills, tile on every façade, the sea showing up in slices at the end of every street. Ate grilled sardines at a place where the waiter didn\u2019t speak English and I didn\u2019t speak Portuguese and somehow the meal still went perfectly. Got a little sunburned. The city smells like coffee and salt and diesel and I would happily live inside that combination of smells.',
				weather: { temperature: 22, condition: 'Clear Sky', humidity: 55, windSpeed: 14 },
				emotions: [{ category: 'excited', intensity: 5 }],
			},
			{
				daysAgo: 15,
				text: 'Got thoroughly lost in Alfama for two hours and it was the best thing that has happened on this trip. The map app gave up — the streets are too narrow for GPS to know where you are, half of them are staircases, and the other half loop back on themselves. Ended up in a tiny square with one café and one fado guitarist practicing, all for an audience of three old men and a cat. Paid two euros for a coffee and stayed an hour.',
				weather: { temperature: 24, condition: 'Clear Sky', humidity: 52, windSpeed: 11 },
				emotions: [{ category: 'curious', intensity: 5 }],
			},
			{
				daysAgo: 17,
				text: 'Pastéis de nata at the place everyone says is the best — no sign on the door, just a queue that doesn\u2019t move for twenty minutes and then suddenly does. The pastries come out of the oven in trays and they hand them across still hot enough to burn your fingers. Worth every minute of the queue. Bought six, ate two on the walk, told myself the other four were for later, ate three more in the park.',
				weather: { temperature: 23, condition: 'Mainly Clear', humidity: 58, windSpeed: 9 },
				emotions: [{ category: 'joyful', intensity: 5 }],
			},
			{
				daysAgo: 21,
				text: 'Night train to Madrid. Couldn\u2019t sleep — the bunk was the length of a toddler\u2019s bed and someone two compartments down was snoring in perfect four-four time. Gave up around two and sat by the window with the book I\u2019d been ignoring all trip. Read until the window turned blue and then pink and then gold. There\u2019s a particular loneliness to being awake at 4 am on a moving train in a country where you don\u2019t speak the language, and I think I will miss it.',
				emotions: [{ category: 'curious', intensity: 3 }],
			},
			{
				daysAgo: 23,
				text: 'Barcelona. Walked into the Sagrada expecting to be underwhelmed by a thing I\u2019d seen a thousand photographs of, and was instead flattened by it. It does not look real. The light inside is the color of something you\u2019d dream and not be able to describe. I stood in the nave for twenty minutes without moving and my neck hurt when I left. I understand, for the first time, why a person would give a century of their life to one building.',
				weather: { temperature: 26, condition: 'Clear Sky', humidity: 48, windSpeed: 12 },
				emotions: [{ category: 'awe', intensity: 5 }],
			},
			{
				daysAgo: 45,
				text: 'Airport hotel on the way home. Paper-thin walls, someone watching a game show through one of them, the particular fluorescent hum of a room that has hosted ten thousand strangers and remembers none of them. Three hours until the flight. Tried to sleep, gave up, sat on the bed and caught up on this journal instead. Travel always ends this way — half excited to be going home, half mourning the version of yourself you only get to be when you\u2019re somewhere else.',
				emotions: [{ category: 'tired', intensity: 4 }],
			},
		],
	},
	{
		name: 'Fitness',
		icon: 'flame',
		color: '#D97B48',
		entries: [
			{
				daysAgo: 0,
				text: '5K at easy pace, the first ten minutes felt like running through wet sand and then, somewhere around the bridge, the legs remembered themselves and I stopped noticing them. This is the part of running nobody describes accurately — it is not fun exactly, not even close to fun for the first third, but at some point the body stops being a thing you are negotiating with and starts being a vehicle you\u2019re sitting inside. Splits were even. Heart rate came down faster than last week.',
				weather: {
					temperature: 11,
					condition: 'Partly Cloudy',
					humidity: 68,
					windSpeed: 10,
				},
				emotions: [{ category: 'energetic', intensity: 4 }],
			},
			{
				daysAgo: 2,
				text: 'Deadlifts day. Added 5kg to the working set and it moved cleanly — form held, lockout was honest, no back rounding on the last rep. Grip is starting to be the limiting factor, which is a good problem to have because it means the posterior chain has finally caught up. Next block I\u2019m adding a weekly farmer\u2019s carry session. Wrote it in the program so I can\u2019t negotiate with myself on Wednesday.',
				emotions: [{ category: 'proud', intensity: 4 }],
			},
			{
				daysAgo: 4,
				text: 'Skipped the gym today. Told myself it was a rest day, which may even be true — I\u2019ve been training five days for three weeks and my shoulders have been pinching on pressing work. But I know myself. One scheduled rest day is recovery; two in a row is the beginning of a story I\u2019ve told before. Going tomorrow regardless of how I feel. The deal I\u2019ve made with myself is that I don\u2019t need to feel like it. I just need to show up.',
				emotions: [{ category: 'apathetic', intensity: 3 }],
			},
			{
				daysAgo: 6,
				text: 'Long bike ride along the coast road — out past the point, around the cove, all the way to the lighthouse and back. Two and a half hours of nothing but wind and the click of the gears and the occasional car I could hear coming for half a mile. Didn\u2019t put in headphones once. My legs are cooked, my back is sunburned in exactly the shape of a cycling jersey, and I feel lighter than I have in weeks. Whatever this feeling is, I need more of it.',
				weather: { temperature: 17, condition: 'Clear Sky', humidity: 60, windSpeed: 18 },
				emotions: [{ category: 'free', intensity: 5 }],
			},
			{
				daysAgo: 9,
				text: 'Mobility session. Hips are as tight as they\u2019ve ever been, which tracks because I have been treating stretching as the thing you do only when something hurts. Spent twenty minutes on hip openers and pigeon and felt muscles unlocking that I\u2019d forgotten I had. The physio told me this six months ago and I politely ignored him. He was right. I don\u2019t like it when people are right about things I\u2019ve been avoiding.',
				emotions: [{ category: 'frustrated', intensity: 2 }],
			},
			{
				daysAgo: 12,
				text: 'New PR on the bench this morning — not by much, only 2.5kg over the last one, and the last one was months ago. But the bar moved and the spotter didn\u2019t touch it and I did not have to grind it out. It\u2019s a strange thing, strength training, the way progress becomes something you measure in quarters rather than weeks. I walked around the rest of the day slightly taller.',
				emotions: [{ category: 'proud', intensity: 5 }],
			},
			{
				daysAgo: 16,
				text: 'First yoga class in probably a year. The studio was warmer than I remembered and I was stiffer than I wanted to admit. Halfway through half-pigeon I started laughing — not out of joy exactly, more that my hips were making noises my body had never agreed to in writing, and the absurdity of it hit me. The instructor came over and gently adjusted my back foot and said, very softly, "you are doing great," and meant it, and I almost cried. I am going back next week.',
				emotions: [{ category: 'playful', intensity: 4 }],
			},
		],
	},
	{
		name: 'Reading',
		icon: 'lightbulb',
		color: '#D9C248',
		entries: [
			{
				daysAgo: 1,
				text: 'Finished Stoner this afternoon, on the train, and had to sit with the last page for a long time before I could close the book. Three separate times I\u2019ve tried to read it over the years and bounced off in the first hundred pages, convinced it was too quiet to be doing anything. It was — right up until it wasn\u2019t. A whole life rendered in that flat, unshowy prose, and by the end I was wrecked. Some books are just waiting for you to be ready.',
				emotions: [{ category: 'content', intensity: 5 }],
			},
			{
				daysAgo: 3,
				text: 'Started The Overstory. The opening is slow in a way that is almost daring you to put it down — it builds these parallel stories that seem to have nothing to do with each other, and you have to trust that the braid is coming. Thirty pages in I can already tell every paragraph is doing more work than it looks like. Powers writes about trees the way most writers write about people. I suspect that\u2019s the whole point.',
				emotions: [{ category: 'curious', intensity: 4 }],
			},
			{
				daysAgo: 7,
				text: 'Reread the first chapter of Gödel, Escher, Bach on a lark. I remember bouncing off it in my twenties, and fifteen years later I can report: still bouncing, but now with more context. The dialogue format is a choice. The MU-puzzle genuinely rewired my brain for about a day the first time I saw it, and the memory of that is the reason I keep coming back. Not sure I\u2019ll finish it this time either. That feels okay.',
				emotions: [{ category: 'confused', intensity: 3 }],
			},
			{
				daysAgo: 11,
				text: 'Picked up a short story collection at the secondhand place on Calle Ancha — nobody I\u2019d heard of, a press I didn\u2019t recognize, translated from the Slovenian. Three euros. The first story is about a woman who inherits her dead mother\u2019s bees and discovers she can understand them. It shouldn\u2019t work and it absolutely does. This is why I keep going to secondhand bookshops — algorithms never recommend me anything this strange.',
				emotions: [{ category: 'curious', intensity: 4 }],
			},
			{
				daysAgo: 16,
				text: 'DNF\u2019d the thriller at page 80. The detective was bored, which meant I was bored, and I\u2019ve finally internalized that finishing a book I\u2019m not enjoying is not a moral achievement, just a waste of the only time I\u2019ve got. There was a period in my twenties when I believed quitting a book was a kind of failure, and I read so many bad books with such misplaced rigor. Now I close them without ceremony and feel nothing but relief.',
				emotions: [{ category: 'bored', intensity: 3 }],
			},
			{
				daysAgo: 22,
				text: 'Poetry night at S.\u2019s place — seven of us crowded into her living room, taking turns reading whatever we\u2019d brought. I read the Mary Oliver, "Wild Geese," because I didn\u2019t trust myself to make it through "The Summer Day" without my voice going. There\u2019s a particular vulnerability in reading someone else\u2019s poem out loud to people who are paying attention, and I had forgotten how much I like it. Drove home the long way with the windows down.',
				emotions: [{ category: 'content', intensity: 4 }],
			},
		],
	},
	{
		name: 'Dreams',
		icon: 'moon',
		color: '#6B6BD9',
		entries: [
			{
				daysAgo: 0,
				text: 'Flying again, the recurring one, but something was different this time. Low over a flooded city — the water was up to the second-story windows and the streets were canals and I could see fish moving between the streetlamps. Usually in the flying dreams I\u2019m anxious, there\u2019s the possibility of dropping, the breath-held quality of trying to stay up. This time I was just steering. Leaning into turns. The air had weight the way water does. Woke up with the distinct feeling I had learned something I can\u2019t quite recover.',
				emotions: [{ category: 'free', intensity: 5 }],
			},
			{
				daysAgo: 2,
				text: 'Back at my old high school. The hallways kept changing length the way hallways in dreams do — I\u2019d walk to the end of one and realize I\u2019d been walking for ten minutes and the lockers were still the wrong color. Late for a test I hadn\u2019t studied for, in a subject I never took. The teacher was a composite of three teachers I disliked, fused at the shoulders. I was wearing clothes from when I was fourteen. Woke up at 5 am with my heart still going, took me an hour to get back down.',
				emotions: [{ category: 'anxious', intensity: 4 }],
			},
			{
				daysAgo: 5,
				text: 'Dreamt about the house in the mountains again. It\u2019s never the same house, exactly — sometimes the porch is bigger, sometimes the kitchen opens onto a forest that couldn\u2019t possibly fit — but it\u2019s always the same feeling of arriving. I know I\u2019ve never been there. I\u2019m starting to think the place isn\u2019t a place, it\u2019s a version of my life I didn\u2019t end up choosing, and the dreams are just the ghost of it saying hello. Woke up lonely for a house that doesn\u2019t exist.',
				emotions: [{ category: 'empty', intensity: 3 }],
			},
			{
				daysAgo: 9,
				text: 'Grandmother visited last night. We were at her kitchen table, the one with the vinyl tablecloth with the roosters on it, and she was telling me something important. I remember being desperate to listen, and I remember her face, and I remember the way her voice got quieter and quieter the way hers did at the end. I cannot, this morning, remember a single word she said. I spent the first twenty minutes awake trying to get back there. She\u2019s been gone six years and I still feel robbed of that last conversation.',
				emotions: [{ category: 'grief', intensity: 4 }],
			},
			{
				daysAgo: 13,
				text: 'Ocean, at night, from a tiny wooden boat. Black water in every direction and the sky bright with stars in a way you only see when you\u2019re nowhere near a city. There was something underneath the boat — I could feel it, the way you feel a truck you can\u2019t see. In any other version of this dream I would have woken up sweating. In this one I leaned over the side and looked straight down into the dark and wasn\u2019t afraid. I think I waved at it. That may be something.',
				emotions: [{ category: 'awe', intensity: 4 }],
			},
		],
	},
];

export async function seedMockData(db: Db): Promise<void> {
	await db.transaction(async (tx) => {
		await tx.delete(weatherRecords);
		await tx.delete(emotionRecords);
		await tx.delete(entries);
		await tx.delete(journals);

		for (const [journalIndex, journal] of MOCK_JOURNALS.entries()) {
			const journalId = generateId();
			const journalDate = new Date();
			await tx.insert(journals).values({
				id: journalId,
				name: journal.name,
				icon: journal.icon,
				color: journal.color,
				displayOrder: journalIndex,
				createdAt: journalDate,
				updatedAt: journalDate,
			});

			for (const entry of journal.entries) {
				const entryId = generateId();
				const createdAt = new Date(Date.now() - entry.daysAgo * ONE_DAY_MS);
				await tx.insert(entries).values({
					id: entryId,
					journalId,
					contentHtml: `<html><p>${entry.text}</p></html>`,
					contentText: entry.text,
					createdAt,
					updatedAt: createdAt,
				});

				if (entry.weather) {
					await tx.insert(weatherRecords).values({
						id: generateId(),
						entryId,
						...entry.weather,
						createdAt,
					});
				}

				if (entry.emotions) {
					for (const emotion of entry.emotions) {
						await tx.insert(emotionRecords).values({
							id: generateId(),
							entryId,
							...emotion,
							createdAt,
						});
					}
				}
			}
		}
	});
}
