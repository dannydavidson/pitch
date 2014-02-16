// set local only collection to store connected clients
var Connected = new Meteor.Collection( null );

Meteor.startup( function ( ) {
	// set content margin, matches content margin in CSS
	var contentMargin = 10,
		setHeights = true;

	Session.set( 'numColumns', 1 );

	// methods for client namespace
	_( Meteor.pitch ).extend( {
		setContentHeight: function ( ) {
			if ( setHeights ) {
				var height = verge.viewportH( ),
					headerHeight = $( '.header' ).height( );
				$( 'body' ).css( 'margin-top', headerHeight );
				$( ".content" ).height( height - ( contentMargin * 2 ) - headerHeight );
			}
		},
		handleAdd: function ( message ) {
			Connected.insert( {
				user: message.added
			} );
			Meteor.pitch.mergeConnections( message.clients );
		},
		handleDisconnect: function ( message ) {
			//console.log( message );
			Connected.remove( {
				user: message.removed
			} );
			Meteor.pitch.resubscribeUsers( );
		},
		mergeConnections: function ( userIds ) {
			var connected = Connected.find( {} ).map( function ( conn ) {
				return conn.user;
			} );
			_( userIds ).chain( ).difference( connected ).map( function ( userId ) {
				Connected.insert( {
					user: userId
				} );
			} );
			Meteor.pitch.resubscribeUsers( );
		},
		resubscribeUsers: function ( ) {
			// update subscription

			Meteor.pitch.userHandle = Meteor.subscribe( 'userData', {
				clients: Connected.find( {} ).map( function ( conn ) {
					return conn.user;
				} )
			} )
		},
		adjustContentHeaders: function ( ) {

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
	Meteor.autosubscribe( function ( ) {
		Meteor.subscribe( 'states', function ( ) {
			console.log( Meteor.db.states.find( {} ).fetch( ) );
		} );
		Meteor.subscribe( 'gigs', function ( ) {
			console.log( Meteor.db.gigs.find( {} ).fetch( ) );
		} );
		Meteor.subscribe( 'education', function ( ) {
			console.log( Meteor.db.education.find( {} ).fetch( ) );
		} );
	} );

	// Adjust content height on resize
	$( window ).resize( _( Meteor.pitch.setContentHeight ).throttle( 200 ) );

	// set active panel for each item by reacting to changes
	Meteor.autorun( function ( ) {

		var gigstates = Meteor.db.states.find( {} );
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

	// maintain presence once logged in
	Meteor.autorun( function ( ) {
		var handle,
			user = Meteor.user( );
		if ( user ) {

			// start ping interval
			handle = Meteor.setInterval( function ( ) {
				Meteor.streams.presence.emit( 'ping', Meteor.userId( ) );
			}, Meteor.pitch.pingInterval );
			Meteor.streams.presence.emit( 'ping', Meteor.userId( ) );

			// handle presence events
			Meteor.streams.presence.on( 'drop', Meteor.pitch.handleDisconnect );
			Meteor.streams.presence.on( 'disconnect', Meteor.pitch.handleDisconnect );
			Meteor.streams.presence.on( 'add', Meteor.pitch.handleAdd );

			// get connected client list from server
			Meteor.call( 'getConnected', function ( err, result ) {
				Meteor.pitch.mergeConnections( result );
			} );

		} else {

			// stop ping interval
			Meteor.clearInterval( handle );
		}
	} );

} );

// feed the gigs
Template.gigs.rows = function ( ) {
	console.log( Meteor.db.gigs );
	// fetch all the gigs, making sure an active state is set
	var gigs = Meteor.db.gigs.find( {} ).map( function ( gig ) {

		// fetch matching state, but don't react to changes
		var states = Meteor.db.states.findOne( gig.stateId, {
			reactive: false
		} );

		// decorate with active state
		return _( gig ).extend( {
			active: states && states.active || 'description',
			stateId: states && states._id
		} );
	} );

	// group gigs into rows
	return _( gigs ).chain( ).groupBy( function ( gig, i ) {
		return Math.floor( i / Session.get( 'numColumns' ) );
	} ).values( ).value( );

};

Template.gigRow.rendered = function ( ) {
	// set content heights
	Meteor.pitch.setContentHeight( );

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
		evt.stopImmediatePropagation( );
		Meteor.db.states.update( this.stateId, {
			$set: {
				active: 'tech'
			}
		} );
	},
	'click .lessons, tap .lessons': function ( evt ) {
		evt.preventDefault( );
		evt.stopImmediatePropagation( );
		Meteor.db.states.update( this.stateId, {
			$set: {
				active: 'lessons'
			}
		} );
	},
	'click .description, tap .description': function ( evt ) {
		evt.preventDefault( );
		evt.stopImmediatePropagation( );
		Meteor.db.states.update( this.stateId, {
			$set: {
				active: 'description'
			}
		} );
	}
} );

Template.education.education = function ( ) {
	return Meteor.db.education.findOne( {
		default: true
	} );
}

Template.header.connected = function ( ) {
	return _( Connected.find( {} ).fetch( ) ).chain( ).uniq( function ( conn ) {
		return conn.user;
	} ).map( function ( conn ) {
		return Meteor.users.findOne( conn.user );
	} ).value( );
}

Template.header.brand = function ( ) {
	var numColumns = Session.get( 'numColumns' );
	if ( numColumns > 1 ) {
		return 'Danny Davidson';
	}
	return 'DD';
};
