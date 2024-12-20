const MAX_PLAYERS = 4;
const TEAMS = Math.floor(MAX_PLAYERS / 2);
const HAND_SIZE = 6;

export type PlayerId = number;

export enum Suit {
	Clubs = 0,
	Spades = 1,
	Diamonds = 2,
	Hearts = 3,
	Joker = 4
}
export enum Value {
	Two = 2,
	Three = 3,
	Four = 4,
	Five = 5,
	Six = 6,
	Seven = 7,
	Eight = 8,
	Nine = 9,
	Ten = 10,
	Jack = 11,
	Queen = 12,
	King = 13,
	Ace = 14,
	Joker = 10.5
}
export class Card {
	suit: Suit;
	val: Value;
	constructor(suit: Suit, val: number) {
		this.suit = suit;
		this.val = val;
	}
}

export enum SessionState {
	Joining = 'joining',
	Dealing = 'dealing',
	Bidding = 'bidding',
	Tricking = 'tricking',
	Scoring = 'scoring',
	Finished = 'finished'
}
export enum SessionPlayer {
	A,
	B,
	C,
	D
}
export enum Bid {
	Pass,
	Two = 2,
	Three = 3,
	Four = 4,
	Five = 5,
	Six = 6
}

export class Session {
	state: SessionState;
	players: PlayerId[];
	dealer_player: SessionPlayer;
	curr_player: SessionPlayer;
	curr_passed: boolean[];
	curr_hands: Card[][];
	curr_scores: number[];
	bids: [SessionPlayer, Bid][];
	tricks: [SessionPlayer, Card][][];
	constructor() {
		this.state = SessionState.Joining;
		this.players = new Array();
		this.dealer_player = SessionPlayer.A;
		this.curr_player = this.dealer_player;
		this.curr_passed = new Array(MAX_PLAYERS).fill(false);
		this.curr_hands = Array.from(Array(MAX_PLAYERS), () => new Array());
		this.curr_scores = new Array(TEAMS).fill(0);
		this.bids = new Array();
		this.tricks = new Array();
	}

	join(playerId: PlayerId) {
		if (this.state != SessionState.Joining) {
			console.error('Attempted to join game out of Joining phase.');
			return;
		}

		this.players.push(playerId);

		if (this.players.length == MAX_PLAYERS) {
			this.state = SessionState.Dealing;
			this.deal();
		}
	}

	deal() {
		if (this.state != SessionState.Dealing) {
			console.error('Attempted to deal out of Dealing phase.');
			return;
		}

		let deck = [];
		for (let suit = Suit.Clubs; suit <= Suit.Hearts; suit++) {
			for (let val = Value.Two; val <= Value.Ace; val++) {
				deck.push(new Card(suit, val));
			}
		}
		deck.push(new Card(Suit.Joker, Value.Joker));
		this._shuffle(deck);

		for (let player = 0; player < MAX_PLAYERS; player++) {
			this.curr_hands[player] = deck.slice(player * HAND_SIZE, (player + 1) * HAND_SIZE); // TODO: Figure out if slice() clones. Future mutation may be harmful.
		}

		this.state = SessionState.Bidding;
	}
	_shuffle(arr: any[]) {
		for (let i = 0; i < arr.length - 1; i++) {
			let j = Math.floor(Math.random() * (arr.length - i));
			[arr[i], arr[i + j]] = [arr[i + j], arr[i]];
		}
	}

	bid(player_id: PlayerId, bid: Bid) {
		if (this.state != SessionState.Bidding) {
			console.error('Attempted to bid out of Bidding phase.');
			return;
		}
		if (player_id != this.players[this.curr_player]) {
			console.error('Attempted to bid out of turn.');
			return;
		}
		if (bid != Bid.Pass && bid < Bid.Two && bid > Bid.Six) {
			console.error(`Attempted to bid an invalid number: ${bid.toString()}.`);
			return;
		}
		if (bid != Bid.Pass && this.bids.length > 0 && bid < this._winning_bid()[1]) {
			console.error('Attempted to bid below maximum bid.');
			return;
		}

		this.bids.push([this.curr_player, bid]);
		if (bid == Bid.Pass) {
			this.curr_passed[this.curr_player] = true;
		}

		if (bid == Bid.Six || this._bids_passed()) {
			this.state = SessionState.Tricking;
		}
		do {
			this.curr_player = (this.curr_player + 1) % MAX_PLAYERS;
		} while (this.curr_passed[this.curr_player]);
	}
	_winning_bid(): [SessionPlayer, Bid] {
		let [max_player, max_bid] = [this.dealer_player, Bid.Two];
		for (const [player, bid] of this.bids.slice(1)) {
			if (bid >= max_bid) {
				max_bid = bid;
				max_player = player;
			}
		}
		return [max_player, max_bid];
	}
	_bids_passed(): boolean {
		for (let i = 0; i < this.curr_passed.length; i++) {
			if (i != this.curr_player && !this.curr_passed[i]) {
				return false;
			}
		}
		return true;
	}

	trick(player_id: PlayerId, card_id: number) {
		if (this.state != SessionState.Tricking) {
			console.error('Attempted to trick out of Tricking phase.');
			return;
		}
		if (player_id != this.players[this.curr_player]) {
			console.error('Attempted to trick out of turn.');
			return;
		}
		let hand = this.curr_hands[this.curr_player];
		if (card_id < 0 || card_id >= hand.length) {
			console.error('Attempted to trick non-existent card.');
			return;
		}

		if (this.tricks.length == 0) {
			this.tricks.push(new Array());
		}
		let curr_trick = this.tricks[this.tricks.length - 1];
		curr_trick.push([this.curr_player, hand[card_id]]);
		hand.splice(card_id, 1);

		if (curr_trick.length == MAX_PLAYERS) {
			this.curr_player = this._winner_of(curr_trick);
			if (this.curr_hands[this.curr_player].length == 0) {
				this.state = SessionState.Scoring;
				this.score();
			} else {
				this.tricks.push(new Array());
			}
		}
		this.curr_player = (this.curr_player + 1) % MAX_PLAYERS;
	}
	// WARNING: Requires non-empty trick.
	_curr_suit(): Suit {
		return this.tricks[this.tricks.length - 1][0][1].suit;
	}
	// WARNING: Requires non-empty trick.
	_trump_suit(): Suit {
		return this.tricks[0][0][1].suit;
	}
	_winner_of(trick: [SessionPlayer, Card][]): SessionPlayer {
		let [max_player, max_card] = trick[0];
		for (const [player, card] of trick.slice(1)) {
			if (this._card_gt(card, max_card)) {
				max_card = card;
				max_player = player;
			}
		}
		return max_player;
	}
	_card_gt(a: Card, b: Card): boolean {
		let trump_suit = this._trump_suit();
		let curr_suit = this._curr_suit();
		let a_suit = a.suit;
		if (a_suit == Suit.Joker) {
			a_suit = trump_suit;
		}
		let b_suit = b.suit;
		if (b_suit == Suit.Joker) {
			b_suit = trump_suit;
		}
		if (a_suit == trump_suit && b_suit != trump_suit) {
			return true;
		}
		if (a_suit != trump_suit && b_suit == trump_suit) {
			return false;
		}
		if (a_suit == curr_suit && b_suit != curr_suit) {
			return true;
		}
		if (a_suit != curr_suit && b_suit == curr_suit) {
			return false;
		}
		return a.val > b.val;
	}

	score() {
		if (this.state != SessionState.Scoring) {
			console.error('Attempted to score out of Scoring phase.');
			return;
		}

		let piles: Card[][] = Array.from(Array(TEAMS), () => new Array());
		for (let curr_trick of this.tricks) {
			let winner = this._winner_of(curr_trick);
			let winner_team = winner % TEAMS;
			for (let [_, card] of curr_trick) {
				piles[winner_team].push(card);
			}
		}

		let [bid_player, bid] = this._winning_bid();
		let bid_team = bid_player % TEAMS;

		let trump_mins: (Value | null)[] = Array.from(piles, this._min_of_trump);
		let trump_maxs: (Value | null)[] = Array.from(piles, this._max_of_trump);
		let small_points: number[] = Array.from(piles, this._sum_of_smallpoints);
		for (let team = 0; team < TEAMS; team++) {
			let team_score = 0;
			let trump_min = trump_mins[team];
			if (trump_min != null && !trump_mins.some((val) => val != null && val < trump_min)) {
				team_score += 1;
			}
			let trump_max = trump_maxs[team];
			if (trump_max != null && !trump_maxs.some((val) => val != null && val < trump_max)) {
				team_score += 1;
			}
			let small_point = small_points[team];
			if (small_point != null && !small_points.some((val) => val >= small_point)) {
				team_score += 1;
			}
			if (this._has_jack_trump(piles[team])) {
				team_score += 1;
			}
			if (this._has_jack_off(piles[team])) {
				team_score += 1;
			}
			if (this._has_joker(piles[team])) {
				team_score += 1;
			}

			if (team == bid_team) {
			  if (team_score >= bid) {
			    this.curr_scores[team] += team_score;
			  } else {
			    this.curr_scores[team] -= bid;
			  }
			} else {
  			this.curr_scores[team] += team_score;
			}
		}

		if (this.curr_scores.some((score, _idx, _arr) => score >= 21)) {
		  this.state = SessionState.Finished;
		} else {
  		this.curr_passed = new Array(MAX_PLAYERS).fill(false);
  		this.bids = new Array();
  		this.tricks = new Array();
  		this.state = SessionState.Dealing;
  		this.deal();
		}
	}
	_min_of_trump(pile: Card[]): Value | null {
		let trump_suit = this._trump_suit();
		let min_val = null;
		for (let card of pile) {
			if (card.suit == trump_suit && (min_val == null || min_val > card.val)) {
				min_val = card.val;
			}
		}
		return min_val;
	}
	_max_of_trump(pile: Card[]): Value | null {
		let trump_suit = this._trump_suit();
		let max_val = null;
		for (let card of pile) {
			if (card.suit == trump_suit && (max_val == null || max_val > card.val)) {
				max_val = card.val;
			}
		}
		return max_val;
	}
	_sum_of_smallpoints(pile: Card[]): number {
		return pile
			.map((card, _idx, _arr) => {
				if (card.val == Value.Jack) {
					return 1;
				}
				if (card.val == Value.Queen) {
					return 2;
				}
				if (card.val == Value.King) {
					return 3;
				}
				if (card.val == Value.Ace) {
					return 4;
				}
				if (card.val == Value.Ten) {
					return 10;
				}
				return 0;
			})
			.reduce((acc: number, x) => acc + x, 0);
	}
	_has_jack_trump(pile: Card[]): boolean {
		let trump_suit = this._trump_suit();
		return pile.some((card, _idx, _arr) => card.suit == trump_suit && card.val == Value.Jack);
	}
	_has_jack_off(pile: Card[]): boolean {
		let trump_suit = this._trump_suit();
		let off_suit: Suit = ((trump_suit + 1) % 2) + Math.floor(trump_suit / 2) * 2;
		return pile.some((card, _idx, _arr) => card.suit == off_suit && card.val == Value.Jack);
	}
	_has_joker(pile: Card[]): boolean {
		return pile.some((card, _idx, _arr) => card.suit == Suit.Joker);
	}
}
