// Tournament specific methods (shared between index and tournament play page)
function tournament_constructed(type) {
	switch ( type ) {
		case 'draft' :
		case 'sealed' :
			return false ;
		case 'vintage' :
		case 'legacy' :
		case 'modern' :
		case 'extend' :
		case 'standard' :
		case 'edh' :
			return true ;
		default :
			return null ;
	}
}
function tournament_limited(type) {
	switch ( type ) {
		case 'draft' :
		case 'sealed' :
			return true ;
		case 'vintage' :
		case 'legacy' :
		case 'modern' :
		case 'extend' :
		case 'standard' :
		case 'edh' :
			return false ;
		default :
			return null ;
	}
}
function player_status(stat, ready) {
	var result = 'Initializing' ;
	switch ( parseInt(stat) ) {
		case 0 :
			result = 'Waiting' ;
			break;
		case 1 :
			result = 'Redirecting' ;
			break;
		case 2 :
			if ( ready == 1 )
				result = 'Finished drafting' ;
			else
				result = 'Drafting' ;
			break;
		case 3 :
			if ( ready == 1 )
				result = 'Finished building' ;
			else
				result = 'Building' ;
			break;
		case 4 :
			if ( ready == 1 )
				result = 'Finished playing' ;
			else
				result = 'Playing' ;
			break;
		case 5 :
			result = 'Ended' ;
			break;
		case 6 :
			result = 'BYE' ;
			break;
		case 7 :
			result = 'Dropped' ;
			break;
		default : 
			result = 'Unknown status : '+stat ;
	}
	return result ;
}
function tournament_status(stat) {
	var result = 'Initializing' ;
	switch ( parseInt(stat) ) {
		case 0 :
			result = 'Canceled' ;
			break;
		case 1 :
			result = 'Pending' ;
			break;
		case 2 :
			result = 'Waiting players' ;
			break;
		case 3 :
			result = 'Drafting' ;
			break;
		case 4 :
			result = 'Building' ;
			break;
		case 5 :
			result = 'Playing' ;
			break;
		case 6 :
			result = 'Ended' ;
			break;
		default : 
			result = 'Unknown status : '+stat ;
	}
	return result ;
}
function tournament_log_li(line, nick, players, spectactors) {
	var msg = 'default message' ;
	switch ( line.type ) {
		case 'create' :
			msg = 'Tournament created by '+nick ;
			break ;
		case 'register' :
			msg = nick+' registered' ;
			break ;
		case 'players' :
			msg = 'Tournament has enough players' ;
			break ;
		case 'spectactor' :
			var li = create_li(nick+' joined as spectactor') ;
			var p = player_get(players, $.cookie(session_id)) ;
			var s = spectactors.get(line.sender) ;
			if ( ( p != null ) && ( ! s.is_allowed($.cookie(session_id)) ) )
				li.appendChild(create_button(create_text('Allow'), function(ev) {
					if ( s == null )
						return false ;
					s.allow($.cookie(session_id)) ;
					$.getJSON('json/allow.php', {'id': tid, 'spectactor': line.sender}, function(data) {
						if ( data.nb != 1 )
							alert(data.nb+' affected rows') ;
					}) ;
				})) ;
			return li ;
			break ;
		case 'allow' :
			var s = spectactors.get(line.value) ;
			msg = nick+' allowed '+s.nick ;
			break ;
		case 'draft' :
			msg = 'Draft started' ;
			break ;
		case 'build' :
			msg = 'Build started' ;
			break ;
		case 'save' :
			msg = nick+' saved a deck' ;
			break ;
		case 'ready' :
			if ( line.value == '1' )
				msg = nick+' is ready' ;
			else
				msg = nick+' isn\'t ready anymore' ;
			break ;
		case 'start' :
			msg = 'Tournament started' ;
			break ;
		case 'win' :
			msg = nick+' won its match' ;
			break ;
		case 'round' :
			msg = 'Round '+line.value+' started' ;
			break ;
		case 'end' :
			msg = 'Tournament ended' ;
			if ( pid != '' ) // New fashion winner
				msg += ', congratulations to '+nick ;
			else
				if ( line.value != '' ) // Old fashion winner
					msg += ', congratulations to '+line.value ;
				else
					msg += ', can\'t fnid a winner' ;
			break ;
		case 'msg' :
			msg = '<'+nick+'> '+line.value ;
			break ;
		default :
			msg = line.type+' : '+line.value+' (raw)' ;
	}
	return create_li(msg) ;
}
function tournament_log_ul(tournament_log, log, players, spectactors) {
	node_empty(tournament_log) ;
	while ( log.length > 0 ) {
		line = log.shift() ;
		last_id = parseInt(line.id) ;
		if ( line.sender == '' )
			nick = 'Server' ;
		else {
			nick = line.sender ;
			var p = player_get(players, line.sender) ;
			if ( p != null )
				nick = p.nick ;
			else {
				var s = spectactors.get(line.sender) ;
				if ( s != null )
					nick = s.nick ;
			}
		}
		var li = tournament_log_li(line, nick, players, spectactors) ;
		li.title = (new Date(line.timestamp.replace(' ', 'T'))).toLocaleTimeString() ;
		tournament_log.appendChild(li) ;
	}
}
function tournament_spectactors(log, spectactors) {
	for ( var i = 0 ; i < log.length ; i++ ) {
		var line = log[i] ;
		if ( line.type == 'spectactor' )
			spectactors.add(line.sender, line.value) ; // Duplicate managed in add
		if ( line.type == 'allow' ) {
			var s = spectactors.get(line.value) ;
			s.allow(line.sender) ;
		}

	}
}
function player_get(players, id) {
	for ( var i in players )
		if ( players[i].player_id == id )
			return players[i] ;
	return null ;
}
function Spectactor(id, nick) {
	this.id = id ;
	this.nick = nick ;
	this.joined = false ;
	this.allowed = [] ;
	this.allow = function(player) {
		if ( this.is_allowed(player) ) 
			return false ;
		this.allowed.push(player) ;
		prev_data = '' ; // Reinit cache, in order timer to rebuild players table, adding the 'view' option
		return true ;
	}
	this.is_allowed = function(player) {
		return ( this.allowed.indexOf(player) != -1 ) ;
	}
}
function Spectactors() {
	this.spectactors = [] ;
	this.add = function(id, nick) {
		var s = this.get(id) ; // Don't create if already in list
		if ( s != null )
			return s ;
		var s = new Spectactor(id, nick) ;
		this.spectactors.push(s) ;
		return s ;
	}
	this.get = function (id) {
		for ( var i in this.spectactors )
			if ( this.spectactors[i].id == id )
				return this.spectactors[i] ;
		return null ;
	}
}
