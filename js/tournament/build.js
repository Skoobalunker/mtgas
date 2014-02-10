function start_spectactor(id, pid) {
	player_id = pid
	init() ;
	$.getJSON('json/deck.php', {'id': id, 'player_id': player_id}, function(obj) { // Get deck as JS object
		obj.side = obj.side.filter(filter_lands, 'sb') ;
		obj.side.sort(alpha_sort) ; // In limited, sort pool cards alphabetically to regroup them
		disp_side(obj.side, pool) ;
		obj.main = obj.main.filter(filter_lands, 'md') ;
		disp_side(obj.main, deck) ;
		poolcards = obj ;
		tournament_init(id) ;
		timer(id, true) ;
	}) ;
}
function start_tournament(id) { // Start all that is only related to current tournament
	init() ;
	player_id = $.cookie(session_id) ;
	// Events
	ready.addEventListener('change', function(ev) {
		$.getJSON('json/ready.php', {'id': id, 'ready': ev.target.checked+0}) ;
	}, false) ;
	var ready_label = ready.parentNode ;
	ready_label.addEventListener('click', function(ev) {
		if ( ready.disabled && confirm('Are you sure you are ready ? ('+poolcards.main.length+'cards in your library)') )
			ready.disabled = false ;
	}, false) ;
	// Deck mw -> json (after creating lands because they will be filtered)
	$.getJSON('json/deck.php', {'id': id}, function(obj) { // Get deck as JS object
		obj.side = obj.side.filter(filter_lands, 'sb') ;
		obj.side.sort(alpha_sort) ; // In limited, sort pool cards alphabetically to regroup them
		obj.main = obj.main.filter(filter_lands, 'md') ;
		disp_side(obj.side, pool) ;
		disp_side(obj.main, deck) ;
		poolcards = obj ;
		tournament_init(id) ;
		// Apply at startup what is applied after each save
		if ( poolcards.main.length > 39 )
			ready.removeAttribute('disabled') ;
		else
			if ( ready.checked ) {
				ready.checked = false ;
				$.getJSON('json/ready.php', {'id': tid, 'ready': ready.checked+0}) ;
			}
		timer(id, false) ;
	}) ;
	clear_button.disabled = false ;
}
function start_standalone(deckname, deckcontent) {
	init() ;
	document.getElementById('save').addEventListener('click', function(ev) {
		deckname = prompt('Deck name', deckname) ;
		if ( name != null )
			deck_set(deckname, '// Deck file for Magic Workstation created with mogg.fr\n// NAME : '+deckname+'\n'+obj2deck(clone_deck(poolcards))) ;
	}, false) ;
	$.post('json/deck.php', {'deck': deckcontent}, function(obj) { // Get deck as JS object
		obj.side = obj.side.filter(filter_lands, 'sb') ;
		disp_side(obj.side, pool) ;
		obj.main = obj.main.filter(filter_lands, 'md') ;
		disp_side(obj.main, deck) ;
		poolcards = obj ;
	}, 'json') ;
	clear_button.disabled = false ;
}
function init() {
	// Initialisations
	game = new Object() ;
	game.image_cache = new image_cache() ;
	game.options = new Options() ;
	pool = document.getElementById('pool') ;
	deck = document.getElementById('deck') ;
	land = document.getElementById('land') ;
	zoom = document.getElementById('zoom') ;
	zoomed = document.getElementById('zoomed') ;
	fliped = document.getElementById('fliped') ;
	transformed = document.getElementById('transformed') ;
	zoomed.width = cardimagewidth ;
	fliped.width = cardimagewidth ;
	transformed.width = cardimagewidth ;
	ready = document.getElementById('ready') ;
	tournament = null ;
	ajax_error_management() ;
	poolcards = null ;
	spectactor = true ;
	clear_button = document.getElementById('clear_button') ;
	if ( clear_button != null )
		clear_button.addEventListener('click', function(ev) {
			poolcards.side = poolcards.side.concat(poolcards.main) ;
			poolcards.main = [] ;
			disp_side(poolcards.side, pool) ;
			disp_side(poolcards.main, deck) ;
			silent_save() ;
		}, false)
	// Link between mana colors array and mana color checks
	manacolors = ['X', 'W', 'U', 'B', 'R', 'G'] ;
	active_color = {} ;
	for ( var i in manacolors ) {
		var color = manacolors[i] ;
		var check = document.getElementById('check_c_'+color) ;
		active_color[color] = check.checked ;
		label_check(check) ;
		check.addEventListener('change', function(ev) {
			active_color[ev.target.value] = ev.target.checked ;
			label_check(ev.target) ;
			disp_side(poolcards.side, pool) ;
			check_all_c() ;
		}, false) ;
		check.previousElementSibling.addEventListener('dblclick', function(ev) { // Double click : select only that one
			for ( var i in manacolors ) {
				var color = manacolors[i] ;
				var check = document.getElementById('check_c_'+color) ;
				check.checked = ( check == ev.target.nextElementSibling ) ;
				active_color[check.value] = check.checked ;
				label_check(check) ;
			}
			disp_side(poolcards.side, pool) ;
			ev.preventDefault() ;
		}, false) ;
		check.previousElementSibling.addEventListener('contextmenu', function(ev) { // Right click : select all but that one
			for ( var i in manacolors ) {
				var color = manacolors[i] ;
				var check = document.getElementById('check_c_'+color) ;
				check.checked = ( check != ev.target.nextElementSibling ) ;
				active_color[check.value] = check.checked ;
				label_check(check) ;
			}
			disp_side(poolcards.side, pool) ;
			ev.preventDefault() ;
		}, false) ;
	}
		// Link between mana colors checks and "all" check
	check_all_c() ;
	label_check(document.getElementById('check_c_all')) ;
	document.getElementById('check_c_all').addEventListener('change', function(ev) {
		label_check(ev.target) ;
		for ( var i in manacolors ) {
			var color = manacolors[i] ;
			var check = document.getElementById('check_c_'+color) ;
			check.checked = ev.target.checked ;
			label_check(check) ;
			active_color[color] = check.checked ;
		}
		disp_side(poolcards.side, pool) ;
	}, false) ;
		// Link between rarities array and rarity check
	rarities = ['C', 'U', 'R'] ;
	active_rarity = {} ;
	for ( var i in rarities ) {
		var rarity = rarities[i] ;
		var check = document.getElementById('check_r_'+rarity) ;
		active_rarity[rarity] = check.checked ;
		label_check(check) ;
		check.addEventListener('change', function(ev) {
			active_rarity[ev.target.value] = ev.target.checked ;
			label_check(ev.target) ;
			disp_side(poolcards.side, pool) ;
			check_all_r() ;
		}, false) ;
	}
		// Link between rarity checks and "all" check
	check_all_r() ;
	label_check(document.getElementById('check_r_all')) ;
	document.getElementById('check_r_all').addEventListener('change', function(ev) {
		label_check(ev.target) ;
		for ( var i in rarities ) {
			var rarity = rarities[i] ;
			var check = document.getElementById('check_r_'+rarity) ;
			check.checked = ev.target.checked ;
			label_check(check) ;
			active_rarity[rarity] = check.checked ;
		}
		disp_side(poolcards.side, pool) ;
	}, false) ;
		// Basic lands
	lands = [] ;
	function landbase(id, name, mana) {
		return {'id': id, 'name': name, 'ext': 'UNH', 'rarity': 'L', 'attrs': {'color': 'X', 'color_index': 1, 'types': ['land'], 'supertypes': ['basic'], 'provide': [mana]}, toString: function() { return this.name+"\n" ; } } ;
	}
	arr = [
		landbase(3332, 'Forest', 'G'),
		landbase(4621, 'Island', 'U'),
		landbase(6020, 'Mountain', 'R'),
		landbase(6871, 'Plains', 'W'),
		landbase(9266, 'Swamp', 'B')
	] ;
	var land_main = create_tr(land) ;
	var land_side = create_tr(land) ;
	for ( var i in arr ) {
		var card = arr[i] ;
		lands.push(card) ;
		var td = create_td(land_main, land_div(card, 'md')) ;
		td.title = 'Maindeck '+arr[i].name ;
		td.title += ', click to add, right click to remove one, middle click to remove all' ;
		var td = create_td(land_side, land_div(card, 'sb')) ;
		td.title = 'Sideboard '+arr[i].name ;
		td.title += ', click to add, right click to remove one, middle click to remove all' ;
	}
}
// Timer loop
started = null ; // Is tournament already started when user loads page
function timer(id, s) {
	spectactor = s ;
	$.getJSON('json/tournament.php', {'id': id, 'firsttime': true}, function(data) { // Get time left
		tournament = data ;
		if ( ( ! spectactor ) && ( data.status != 4 ) ) // If tournament isn't in "building" status, go back to tournament index (that will normally redirect to build)
			window.location.replace('index.php?id='+id) ;
		else {
			window.setTimeout(timer, sealed_timer, id, spectactor) ; // Refresh in 30 secs
			document.getElementById('timeleft').value = time_disp(parseInt(data.timeleft)) ;
			tournament_players_update(data) ;
			tournament_log_update(data) ;
			if ( data.log.length > 0 ) { // First recieved object doesn't contain log
				for ( var i = 0 ; i < data.log.length ; i++ )
					if ( data.log[i].type == 'start' ) {
						if ( started == null )
							started = true ; // tournament is already started
						else if ( ! started ) // Not started yet, but recieving this means we need redirection
							window.location.replace('index.php?id='+id) ;
					}
				if ( started == null )
					started = false // After reading all log messages, we know if game is already started at page load
			}
			if ( spectactor )
				for ( var i = 0 ; i < data.players.length ; i++ ) {
					var player = data.players[i] ;
					if ( player.player_id == player_id ) { // Self
						var rdeck = clone_deck(poolcards) ; // poolcards doesn't count land base
						rdeck.main.sort(alpha_sort) ;
						rdeck.side.sort(alpha_sort) ;
						player.deck_obj.main.sort(alpha_sort) ;
						player.deck_obj.side.sort(alpha_sort) ;
						var dt1 = obj2deck(player.deck_obj) ;
						var dt2 = obj2deck(rdeck) ;
						if ( dt1 != dt2 ) {
							// Reinit lands (filled by filter_lands)
							for ( var i in lands ) {
								document.getElementById('md'+lands[i].name).value = 0 ;
								document.getElementById('sb'+lands[i].name).value = 0 ;
							}
							poolcards = player.deck_obj ;
							poolcards.side = poolcards.side.filter(filter_lands, 'sb') ;
							disp_side(poolcards.side, pool) ;
							poolcards.main = poolcards.main.filter(filter_lands, 'md') ;
							disp_side(poolcards.main, deck) ;
						}
					}
				}
		}
	}) ;
}
// Functions
sending = false ; // Goes to true between ajax sending and response
delay = false ; // Tell the response trigger to resend new version of the deck
version = 0 ;
function silent_save() {
	if ( spectactor )
		return false ;
	delay = sending ; // delay current save
	if ( delay ) // already sending a deck
		return false ;
	localpool = clone_deck(poolcards) ;
	localpool.version = version++ ;
	if ( ready.checked && ( localpool.main.length < 40 ) ) {
		ready.checked = false ; // Removed 40th card, uncheck ready
		$.getJSON('json/ready.php', {'id': tid, 'ready': ready.checked+0}) ;
	}
	localpool.side.sort(color_sort) ; // In order side to be sorted by color in limited
	ready.setAttribute('disabled', 'true') ; // Don't send save while previous sent saved isn't recieved
	sending = true ;
	$.post('json/deck_update.php', {'id': tid, 'deck': JSON.stringify(localpool)}, function(data) { // Deck content is too heavy for GET
		sending = false ;
		if ( iss(data.msg) && data.msg != '' )
			alert(data.msg) ;
		if ( localpool.main.length > 39 )
			ready.removeAttribute('disabled') ; // Don't send save while previous sent saved isn't recieved
		if ( delay ) // an save was delayed
			silent_save() ; // resend ;
	}, 'json') ;
}
function clone_deck(poolcards) { // Returns a copy of a deck
	var localpool = {} ; // Local copy of the pool that will be added lands
	// If we clone poolcards, then localpool.main is the same object instance than poolcards.main, so it's not local
	localpool.main = clone(poolcards.main) ;
	localpool.side = clone(poolcards.side) ;
	for ( var i in lands ) {
		var card = lands[i] ;
		for ( var j = 0 ; j < land_nb('md'+card.name) ; j++ )
			localpool.main.push(card) ;
		for ( var j = 0 ; j < land_nb('sb'+card.name) ; j++ )
			localpool.side.push(card) ;
	}
	return localpool ;
}
function alpha_sort(card1, card2) {
	b = color_sort(card1, card2) ; // First sort by color
	if ( b != 0 )
		return b ;
	// Then inside same color, sort by name
	if ( card1.name == card2.name )
		return 0 ;
	if ( card1.name > card2.name )
		return 1 ;
	return -1 ;
}
function color_sort(card1, card2) {
	return card1.attrs.color_index - card2.attrs.color_index ;
}
function label_check(target) {
	if ( target.checked )
		target.parentNode.classList.add('checked') ;
	else
		target.parentNode.classList.remove('checked') ;
}
function check_all_c() { // If all manacolor check are checked, check the "all", idem if they are unchecked
	var do_check = true ;
	var do_uncheck = true ;
	for ( var i in manacolors )
		if ( active_color[manacolors[i]] )
			do_uncheck = false ;
		else
			do_check = false ;
	if ( do_check )
		document.getElementById('check_c_all').checked = true ;
	if ( do_uncheck )
		document.getElementById('check_c_all').checked = false ;
	if ( do_check || do_uncheck )
		label_check(document.getElementById('check_c_all')) ;
}
function check_all_r() { // Idem for rarity
	var do_check = true ;
	var do_uncheck = true ;
	for ( var i in rarities ) {
		var rarity = rarities[i] ;
		if ( active_rarity[rarity] )
			do_uncheck = false ;
		if ( ! active_rarity[rarity] )
			do_check = false ;
	}
	if ( do_check )
		document.getElementById('check_r_all').checked = true ;
	if ( do_uncheck )
		document.getElementById('check_r_all').checked = false ;
	if ( do_check || do_uncheck )
		label_check(document.getElementById('check_r_all')) ;
}
function land_div(card, prefix) { // Returns visual representation of a land-card
	var div = create_div() ;
	div.classList.add(card.rarity) ;
	if ( window.innerHeight < 800 )
		div.classList.add('sr') ; // Small resolutions
	div.align = 'center' ;
	div.addEventListener('mouseup', function(ev) {
		switch ( ev.button ) {
			case 0 : 
				ev.target.firstChild.value++ ;
				break ;
			case 1 : 
				ev.target.firstChild.value = 0 ;
				break ;
			case 2 : 
				if ( ev.target.firstChild.value > 0 )
					ev.target.firstChild.value-- ;
				break ;
			default: 
				alert('Button '+ev.button+' unmanaged') ;
				return false ;
		}
		silent_save() ;
		disp_side(poolcards.main, deck) ;
	}, false) ;
	div.addEventListener('contextmenu', function(ev) {
		ev.preventDefault() ;
	}, false)
	div.addEventListener('change', function(ev) {
		silent_save() ;
		disp_side(poolcards.main, deck) ;
	}, false) ;
	// Image loading
	game.image_cache.load(card_images(card_image_url(card.ext, card.name, card.attrs)), function(img, tag) {
		tag.url = img.src ;
		tag.style.backgroundImage = 'url('+img.src+')' ;
	}, function(tag, url) {
		tag.appendChild(document.createTextNode(div.firstChild.name)) ;
	}, div) ;
	var val = 0 ;
	var input = create_input(prefix+card.name, val, prefix+card.name) ;
	input.size = 2 ;
	div.appendChild(input) ;
	return div
}
function land_nb(land) {
	var input = document.getElementById(land) ;
	if ( input == null ) {
		alert('Missing input for '+land) ;
		return -1 ;
	} else
		return parseInt(input.value) ;
}
function filter_lands(card, index, cards) {
	for ( var i in lands) {
		if ( card.name == lands[i].name ) {
			document.getElementById(this+card.name).value++ ;
			return false
		}
	}
	return true ;
}
function card_div(card) { // Returns visual representation of a card
	var div = create_div() ;
	if ( window.innerHeight < 800 )
		div.classList.add('sr') ; // Small resolutions
	div.id = card.id ;
	div.card = card ;
	div.classList.add(card.rarity) ;
	div.title = card.name+' , click to add/remove from deck, right or middle click to get infos' ;
	div.url = '' ;
	div.transformed_url = '' ;
	// Image loading
	var urls = card_images(card_image_url(card.ext, card.name, card.attrs)) ;
	if ( iso(card.attrs.split) ) { // Security workaround for cross-site image loading
		for ( var i in urls )
			urls[i] = '/proxy.php?url='+urls[i] ;
	}
	game.image_cache.load(urls, function(img, tag) {
		var src = img.src ;
		tag.url = src ;
		if ( iso(tag.card.attrs.split) ) {
			var rotated = create_canvas(img.height, img.width) ;
			rotated.style.border = '1px solid red' ;
			var ctx = rotated.getContext("2d") ;
			ctx.rotate(Math.PI/2) ;
			ctx.drawImage(img, 0, -img.height) ;
			tag.style.backgroundImage = 'url('+rotated.toDataURL()+')';
		} else
			tag.style.backgroundImage = 'url('+src.replace('\'', '\\\'')+')' ; // Chromium & Opera don't like apostrophes
	}, function(tag, url) {
		tag.appendChild(document.createTextNode('['+tag.card.ext+']'+tag.card.name)) ;
	}, div) ;
	// Transformed image loading
	if ( iso(card.attrs.transformed_attrs) ) {
		game.image_cache.load(card_images(card_image_url(card.ext, card.attrs.transformed_attrs.name, card.attrs)), function(img, tag) {
			tag.transformed_url = img.src ;
		}, function(tag, url) {
			tag.appendChild(document.createTextNode(tag.card.attrs.transformed_attrs.name)) ;
		}, div) ;
	}
	// Events
	div.addEventListener('mouseover', function(ev) { // Initialize zoom
		zoomed.src = ev.target.url ; // "Main" image
		// Split
		if ( iso(ev.target.card.attrs.split) )
			zoomed.classList.add('split') ;
		else
			zoomed.classList.remove('split') ;
		// Flip
		if ( iso(ev.target.card.attrs.flip_attrs) ) {
			fliped.src = ev.target.url ;
			fliped.classList.add('disp') ;
		} else
			fliped.classList.remove('disp') ;
		// Transformed
		if ( ev.target.transformed_url != '' ) {
			transformed.src = ev.target.transformed_url ;
			transformed.classList.add('disp') ;
		} else
			transformed.classList.remove('disp') ;
		zoom.classList.add('disp') ; // Container
	}, false) ;
	div.addEventListener('mousemove', function(ev) { // Update zoom
		// Image is displayed on cursor's bottom right by default
		// If it would make it appear outside "inner" displayed window, display it on cursor's left and/or top
		// The goal of this behaviour is to never display zoom on top of cursor (it would interact with mouse* events)
		// and make cards always readable
		var x = ev.clientX + 5 ; // 5px on cursor's right
		if ( iso(ev.target.card.attrs.split) ) // Split
			x += zoomed.clientHeight ;
		if ( x + zoom.clientWidth > window.innerWidth ) // Outside inner screen
			x = ev.clientX - zoom.clientWidth - 5 ; // 5px on cursor's left
		zoom.style.left = max(x, 0)+'px' ;
		var y = ev.clientY + 5 ;// 5px on cursor's bottom
		if ( y + zoom.clientHeight > window.innerHeight ) { // Outside inner screen
			y = ev.clientY - zoom.clientHeight - 5 ; // 5px on cursor's top
			if ( iso(ev.target.card.attrs.split) ) // Split
				y += zoomed.height - zoomed.width ;
		}
		zoom.style.top = max(y, 0)+'px' ;
	}, false) ;
	div.addEventListener('mouseout', function(ev) { // Clear zoom
		zoom.classList.remove('disp') ;
	}, false) ;
	div.addEventListener('mouseup', function(ev) {
		if ( ! spectactor )
			switch ( ev.button ) {
				case 0 :
					card_toggle(ev.target.card) ;
					zoom.classList.remove('disp') ; // toggling card with a dblclick implies mouse is over div
					// but the toggle won't fire mouseout, doing it by hand here
					break ;
				case 1 :
				case 2 :
					window.open('http://magiccards.info/query?q=!'+ev.target.card.name+'&v=card&s=cname') ;
					break ;
			}
	}, false) ;
	div.addEventListener('contextmenu', function(ev) {
		window.open('http://magiccards.info/query?q=!'+ev.target.card.name+'&v=card&s=cname') ;
		eventStop(ev) ;
	}, false) ;
	return div ;
}
function card_toggle(card) { // If card is in side, move it in deck, vice versa
	var from = null ;
	var to = poolcards.main ;
	var i = poolcards.side.indexOf(card) ;
	if ( i > -1 ) { // Card found in side
		from = poolcards.side ;
	} else {
		i = poolcards.main.indexOf(card) ;
		if ( i > -1 ) { // Card found maindeck
			from = poolcards.main ;
			to = poolcards.side ;
		}
	}
	var topush = from.splice(i, 1)[0] ;
	if ( to != null )
		to.push(topush) ;
	// Refresh displays
	if ( ( from == poolcards.side ) | ( to == poolcards.side ) )
		disp_side(poolcards.side, pool) ;
	if ( ( from == poolcards.main ) | ( to == poolcards.main ) )
		disp_side(poolcards.main, deck) ;
	silent_save() ;
}
function disp_side(originaldeck, table) {
	var side = clone(originaldeck) ; // Working on a clone of original array
	node_empty(table) ;
	var trb = create_tr(table) ;
	var trc = create_tr(table) ;
	var cc = 0 ; // Current converted cost computing
	var nb = 0 ; // Number of cards displayed
	var types = {'creature': 0} ;
	var total = 0 ;
	var cards = [] ;
	do { // Loop on columns while there are cards left
		var beginnb = nb ;
		var tdb = create_td(trb, '') ;
		for ( var i = 0 ; i < side.length ; i++ ) { // Card loop
			if ( i >= side.length ) // Must be done here because of "continue"
				break ;
			var card = side[i] ;
			if ( table == pool ) { // If displaying in pool, only display checked color's cards
				// Count checked colors
				var nbc = 0 ;
				var color = '' ;
				for ( var j in manacolors )
					if ( active_color[manacolors[j]] ) { // Checked
						if ( ++nbc == 1 )
							color = manacolors[j] ;
					}
				// Only one : display golds/hybrids if any of its colors is checked one
				if ( nbc == 1 ) {
					if ( card.attrs.color.indexOf(color) == -1 ) {
						side.splice(i, 1) ; // Remove card from list
						i-- ; // Card n removed, we must go back one step to continue over next card
						continue ;
					}
				} else {
				// More than one : display golds/hybrids only if all of its colors are checked
					var shall_continue = false ; // Indicate if we should go next card
					for ( var j in manacolors ) { // Foreach colors
						var color = manacolors[j] ;
						if ( ! active_color[color] ) // Unchecked
							if ( card.attrs.color.indexOf(color) > -1 ) { // Current card has current color
								side.splice(i, 1) ; // Remove card from list
								i-- ; // Card n removed, we must go back one step to continue over next card
								shall_continue = true ; // After the color loop, continue card loop
								break ; // No need to continue this for
							}
					}
					if ( shall_continue )
						continue ;
				}
				// Filter by rarity
				var r = card.rarity ; // modify this rarity will change border color
				if ( r == 'L' ) // Lands don't appear in deck as their rarity isn't managed
					r = 'C' ; // Consider them as commons
				if ( r == 'M' ) // Consider mythics as rares for selector
					r = 'R' ;
				if ( ( r != 'S' ) && ( ! active_rarity[r] ) ) {
					side.splice(i, 1) ;
					i-- ;
					continue ;
				}
			}
			if ( ! card.attrs )
				log2(card) ;
			else {
				if ( card.attrs.converted_cost == cc ) {
					total++ ;
					side.splice(i, 1) ;
					i-- ; // Card n removed, we must go back one step to continue over next card
					nb++ ; // One card displayed
					card.toString = function() {
						return this.name+"\n" ;
					}
					tdb.appendChild(card_div(card)) ;
					for ( var j = 0 ; j < card.attrs.types.length ; j++ ) { // Count types for stats
						var type = card.attrs.types[j] ;
						if ( ! types[type] )
							types[type] = 1 ;
						else
							types[type]++ ;
					}
					cards.push(card) ;
				}
			}
		}
		create_td(trc, (nb-beginnb)+' cards') ;
		if ( beginnb == nb ) { // No cards were added in current column (for current casting cost), removing column
			var div = create_div('No cards with CC = '+cc) ;
			if ( window.innerHeight < 800 )
				div.classList.add('sr') ; // Small resolutions
			div.classList.add('emptycol') ;
			tdb.appendChild(div) ;
		} else
			beginnb = nb ;
		cc++ ; // Next converted cost
	} while ( ( side.length > 0 ) ) ;
	var trc = create_tr(table) ;
	var nblands = 0 ;
	if ( table == deck ) {
		for ( var i in lands) {
			var nb = parseInt(document.getElementById('md'+lands[i].name).value) ;
			for ( var j = 0 ; j < nb ; j++ )
				cards.push(lands[i]) ;
			nblands += nb ;
		}
		// Stats
		deck_stats_cc(cards) ;
	}
	// Text line at bottom of table resuming content
	create_td(trc, (nb+nblands)+' total cards ('+nblands+' basic lands)') ;
	var line = '' ;
	for ( var i in types )
		line += i+' : '+types[i]+', ' ;
	line = line.substr(0, line.length-2)
	create_td(trc, line, cc-1) ;
}
