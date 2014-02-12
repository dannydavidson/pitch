// define models
db = {};
db.session = new Meteor.Collection( 'session' );
db.gigs = new Meteor.Collection( 'gigs' );
db.gigstate = new Meteor.Collection( 'gigstate' );

// define streams
streams = {};
streams.presence = new Meteor.Stream( 'presence' );

// namespace for shared methods
pitch = {
	pingInterval: 1 * 2000,
	cleanupCoefficient: 2,
	numFailedPingsAllowed: 2
}

if ( Meteor.isClient ) {

	// set content margin, matches content margin in CSS
	var contentMargin = 10,
		setHeights = true;

	// set local only collection to store connected clients
	db.connected = new Meteor.Collection( null );

	// methods for client namespace
	var pitch = _( pitch ).extend( {
		setContentHeight: function ( ) {
			if ( setHeights ) {
				var height = verge.viewportH( );
				$( ".content" ).height( height - ( contentMargin * 2 ) );
			}
		},
		handleAdd: function ( message ) {
			var connected = db.connected.find( {} ).map( function ( conn ) {
				return conn.user;
			} );
			_( connected ).chain( ).difference( message.clients ).map( function ( userId ) {
				db.connected.insert( {
					user: userId
				} );
			} )
			db.connected.insert( {
				user: message.added
			} );
		},
		handleDisconnect: function ( message ) {
			console.log( message );
			db.connected.remove( {
				user: message.removed
			} );
		}
	} );

	// configure login
	Accounts.ui.config( {
		passwordSignupFields: 'USERNAME_ONLY'
	} );

	// register helper
	Handlebars.registerHelper( 'isActive', function ( data, options ) {
		if ( this.active === data ) {
			return options.fn( this );
		}
		return options.inverse( this );
	} );

	// Adjust columns according to breakpoints
	enquire.register( "screen and (max-width: 767px)", {
		match: function ( ) {
			Session.set( 'numColumns', 1 );
		}
	} )

	.register( "screen and (min-width: 768px) and (max-width: 1200px)", {
		match: function ( ) {
			Session.set( 'numColumns', 2 );
		}
	} )

	.register( "screen and (min-width: 1201px)", {
		match: function ( ) {
			Session.set( 'numColumns', 3 );
		}
	} );

	// subscribe to collections
	Meteor.subscribe( 'gigs', function ( ) {

	} );

	Meteor.subscribe( 'gigstate', function ( ) {

	} );

	// Adjust content height on resize
	$( window ).resize( pitch.setContentHeight );

	// feed the gigs
	Template.gigs.rows = function ( ) {

		// fetch all the gigs, making sure an active state is set
		var gigs = _( db.gigs.find( {} ).fetch( ) ).map( function ( gig ) {

			// fetch matching state, but don't react to changes
			var gigstate = db.gigstate.findOne( gig.stateId, {
				reactive: false
			} );

			// decorate with active state
			return _( gig ).extend( {
				active: gigstate && gigstate.active || 'description',
				stateId: gigstate && gigstate._id
			} );
		} );

		// group gigs into rows
		return _( gigs ).chain( ).groupBy( function ( gig, i ) {
			return Math.floor( i / Session.get( 'numColumns' ) );
		} ).values( ).value( );

	};

	Template.gigRow.rendered = function ( ) {
		// set content heights
		pitch.setContentHeight( );

		// match height of headers across row
		var headers = this.findAll( 'h3' ),
			max = _( headers ).max( function ( el ) {
				return $( el ).height( );
			} ),
			height = $( max ).height( );

		_( headers ).each( function ( el ) {
			$( el ).height( height );
		} );

	};

	Template.gig.events( {
		'click .tech, tap .tech': function ( evt ) {
			evt.preventDefault( );
			db.gigstate.update( this.stateId, {
				$set: {
					active: 'tech'
				}
			} );
		},
		'click .lessons, tap .lessons': function ( evt ) {
			evt.preventDefault( );
			db.gigstate.update( this.stateId, {
				$set: {
					active: 'lessons'
				}
			} );
		},
		'click .description, tap .description': function ( evt ) {
			evt.preventDefault( );
			db.gigstate.update( this.stateId, {
				$set: {
					active: 'description'
				}
			} );
		}
	} );

	Template.header.connected = function ( ) {
		console.log( 'connected update' );
		return db.connected.find( {} ).fetch( );
	}

	// set active panel for each item by reacting to changes
	Meteor.autorun( function ( ) {

		var gigstates = db.gigstate.find( {} );
		gigstates.observeChanges( {

			changed: function ( id, fields ) {
				var content = $( '[data-stateId="' + id + '"]' );

				// set active panel and tab
				content.find( '.panel.' + fields.active ).addClass( 'active' );
				content.find( '.controls span.' + fields.active ).addClass( 'selected' );

				// deactivate other panels and tabs
				content.find( '.panel' ).not( '.' + fields.active ).removeClass( 'active' );
				content.find( '.controls span' ).not( '.' + fields.active ).removeClass( 'selected' );
			}

		} );

	} );

	// start ping interval once logged in
	Meteor.autorun( function ( ) {
		var handle,
			user = Meteor.user( );
		if ( user ) {

			// start ping interval
			handle = Meteor.setInterval( function ( ) {
				streams.presence.emit( 'ping', Meteor.userId( ) );
			}, pitch.pingInterval );

			// handle presence events
			streams.presence.on( 'drop', pitch.handleDisconnect );
			streams.presence.on( 'disconnect', pitch.handleDisconnect );
			streams.presence.on( 'add', pitch.handleAdd );
		} else {
			Meteor.clearInterval( handle );
		}
	} );

}



if ( Meteor.isServer ) {

	Meteor.startup( function ( ) {

		// reset gigs
		db.gigs.remove( {} );
		db.gigstate.remove( {} );
		_( gigs ).each( function ( gig ) {

			// create default state record
			var stateId = db.gigstate.insert( {
				active: 'description'
			} );

			// create gig record, setting stateId
			db.gigs.insert( _( gig ).extend( {
				stateId: stateId
			} ) );
		} );

		// reset session
		db.session.remove( {} );
		db.session.insert( {
			name: 'default'
		} );

		// publish records
		Meteor.publish( 'gigs', function ( ) {
			return db.gigs.find( {} );
		} );

		Meteor.publish( 'gigstate', function ( ) {
			return db.gigstate.find( {} );
		} );

	} );

	// broadcast disconnects
	var clients = [ ];
	streams.presence.on( 'ping', function ( ) {

		var userId = this.userId,
			now = new Date( ).getTime( ),
			match = _( clients ).find( function ( client ) {
				return client[ 0 ] === userId;
			} );

		//console.log( 'ping ' + userId );

		if ( match ) {
			match[ 1 ] = now;

		} else {
			//console.log( 'add client ' + userId );
			clients.push( [ userId, now ] );
			streams.presence.emit( 'add', {
				added: userId,
				clients: _( clients ).map( function ( client ) {
					return client[ 0 ];
				} )
			} );

			this.onDisconnect = function ( message ) {
				//console.log( 'disconnect client ' + userId );
				clients = _( clients ).chain( ).map( function ( client ) {
					return client[ 0 ] === userId ? client : false;
				} ).compact( ).value( );
				streams.presence.emit( 'disconnect', {
					removed: userId
				} );
			}
		}

	} );

	Meteor.setInterval( function ( ) {
		var now = new Date( ).getTime( );

		clients = _( clients ).chain( ).map( function ( client ) {
			//console.log( 'cleanup client ' + client );
			if ( client[ 1 ] < now - pitch.pingInterval * pitch.numFailedPingsAllowed ) {
				//console.log( 'drop ' + client[ 0 ] );
				streams.presence.emit( 'drop', {
					removed: client[ 0 ]
				} );
				return;
			}
			return client;

		} ).compact( ).value( );

	}, pitch.pingInterval * pitch.cleanupCoefficient );
}
