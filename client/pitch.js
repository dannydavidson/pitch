// set local only collection to store connected clients
var Connected = new Meteor.Collection( null ),

	toggleModalsOff = function ( evt ) {
		if ( Session.get( 'connectedOpen' ) ) {
			Session.set( 'connectedOpen', false );
		}
		if ( Session.get( 'navOpen' ) ) {
			Session.set( 'navOpen', false );
		}
	}

Session.set( 'loaded', false );

Meteor.startup( function ( ) {
	// set content margin, matches content margin in CSS
	var contentMargin = 10,
		setHeights = true,
		matchSession = /^([a-zA-Z]*)$/gi,
		path = window.location.pathname.substring( 1 ),
		sessionName = _( matchSession.exec( path ) ).first( );

	Session.set( 'session', sessionName || 'default' );
	Session.set( 'navOpen', false );
	Session.set( 'connectedOpen', false );
	Session.set( 'numColumns', 1 );

	// set up fast click
	FastClick.attach( document.body );

	// methods for client namespace
	_( Meteor.pitch ).extend( {
		setContentHeight: function ( ) {
			if ( setHeights ) {
				var height = verge.viewportH( ),
					headerHeight = $( '.header' ).height( );

				if ( Session.get( 'numColumns' ) === 1 ) {
					$( 'body' ).css( {
						'padding-bottom': headerHeight,
						'padding-top': 0
					} );
				} else {
					$( 'body' ).css( {
						'padding-top': headerHeight,
						'padding-bottom': 0
					} );
				}
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
		showStateChange: function ( id, fields ) {
			var session,
				active = fields.active;

			try {
				if ( active ) {
					var activeEl = $( '[data-id="' + active.id + '"]' ).first( ),
						pos = activeEl.position( ),
						headerHeight = $( '.header' ).height( );

					if ( Session.get( 'numColumns' ) === 1 ) {
						pos = pos.top - headerHeight + headerHeight - contentMargin;
					} else {
						pos = pos.top - headerHeight - contentMargin;
					}
					TweenLite.to( $( window ), .75, {
						scrollTo: {
							y: pos
						},
						ease: Power4.easeOut,
						overwrite: 'all'
					} );

					$( '.content.active' ).not( activeEl ).removeClass( 'active' );
					$( activeEl ).addClass( 'active' );

					session = Meteor.db.session.findOne( {
						key: Session.get( 'key' )
					} );

					active = Meteor.db[ session.active.collection ].findOne( {
						_id: session.active.id
					} );

					state = Meteor.db.states.findOne( {
						_id: active.stateId
					} );

					Meteor.pitch.modifyPanelState( state._id, state );
				}
			} catch ( e ) {}
		},
		setActive: function ( evt, collectionName ) {
			var active,
				state,
				root = $( evt.currentTarget ).parents( '[data-collection="' + collectionName + '"]' ).first( ),
				id = root.data( 'id' );

			Meteor.db.session.update( Session.get( 'sessionId' ), {
				$set: {
					active: {
						collection: collectionName,
						id: id
					}
				}
			}, function ( err ) {
				//console.log( err );
			} );

		},
		modifyPanelState: function ( id, fields ) {
			var content = $( '[data-stateId="' + id + '"]' ).first( );

			// set active panel and tab
			content.find( '.panel.' + fields.active ).addClass( 'active' );
			content.find( '.controls span.' + fields.active ).addClass( 'selected' );

			// deactivate other panels and tabs
			content.find( '.panel' ).not( '.' + fields.active ).removeClass( 'active' );
			content.find( '.controls span' ).not( '.' + fields.active ).removeClass( 'selected' );
		},
		refreshState: function ( ) {
			var session = Meteor.db.session.findOne( {
				key: Session.get( 'session' )
			} );
			if ( session ) {
				Meteor.pitch.showStateChange( session._id, {
					active: session.active
				} );
			}
		},
		updateObjective: function ( evt ) {
			var el = $( evt.currentTarget ),
				parent = el.parents( '[data-collection="objective"]' ).first( ),
				id = parent.attr( 'data-id' ),
				newDescription = el.text( ).replace( /(\r\n|\n|\r)/g, '' );

			if ( Meteor.user( ) ) {
				Meteor.db.objective.update( id, {
					$set: {
						description: newDescription
					}
				} );
			}
		}
	} );

	// configure login
	Accounts.config( {
		forbidClientAccountCreation: true
	} );

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
		var onComplete = _.after( 5, function ( ) {
			Session.set( 'loaded', true );
			Meteor.pitch.refreshState( );
		} );

		Meteor.subscribe( 'session', Session.get( 'session' ), function ( ) {
			var s = Meteor.db.session.findOne( {
				key: Session.get( 'session' )
			} );
			if ( s ) {
				Session.set( 'sessionId', s._id )
			}

			Meteor.subscribe( 'states', Session.get( 'session' ), onComplete );
			Meteor.subscribe( 'gigs', Session.get( 'session' ), onComplete );
			Meteor.subscribe( 'objective', Session.get( 'session' ), onComplete );
			Meteor.subscribe( 'education', onComplete );

			onComplete( );
		} );
	} );

	// Adjust content height on resize
	$( window ).resize( _( Meteor.pitch.setContentHeight ).throttle( 200 ) );


	// set active panel for each item by reacting to changes
	Meteor.autorun( function ( ) {

		var states = Meteor.db.states.find( {
			session: Session.get( 'session' )
		} );
		states.observeChanges( {
			changed: Meteor.pitch.modifyPanelState
		} );

	} );


	// update active state whenever the session changes
	Meteor.autorun( function ( ) {
		var session = Meteor.db.session.find( {
			key: Session.get( 'session' )
		} );
		session.observeChanges( {
			changed: Meteor.pitch.showStateChange
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
			Meteor.setTimeout( function ( ) {
				Meteor.call( 'getConnected', function ( err, result ) {
					Meteor.pitch.mergeConnections( result );
				} );
			}, 500 );

		} else {

			// stop ping interval
			Meteor.clearInterval( handle );
		}
	} );

} );

Template.main.loaded = function ( ) {
	return Session.get( 'loaded' );
};

// feed the gigs
Template.gigs.rows = function ( ) {
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
	Meteor.pitch.refreshState( );

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
	'click .tech': function ( evt ) {
		//evt.preventDefault( );
		Meteor.db.states.update( this.stateId, {
			$set: {
				active: 'tech'
			}
		} );
		Meteor.pitch.setActive( evt, 'gigs' );
	},
	'click .lessons': function ( evt ) {
		//evt.preventDefault( );
		Meteor.db.states.update( this.stateId, {
			$set: {
				active: 'lessons'
			}
		} );
		Meteor.pitch.setActive( evt, 'gigs' );
	},
	'click .description': function ( evt ) {
		//evt.preventDefault( );
		Meteor.db.states.update( this.stateId, {
			$set: {
				active: 'description'
			}
		} );
		Meteor.pitch.setActive( evt, 'gigs' );
	},
	'click h3': function ( evt ) {
		Meteor.pitch.setActive( evt, 'gigs' );
	}
} );


Template.education.education = function ( ) {
	var education = Meteor.db.education.findOne( {
		'default': true
	} );
	return education;
}

Template.education.rendered = function ( ) {
	Meteor.pitch.refreshState( );
}

Template.connected.connected = function ( ) {
	return _( Connected.find( {} ).fetch( ) ).chain( ).uniq( function ( conn ) {
		return conn.user;
	} ).map( function ( conn ) {
		return Meteor.users.findOne( conn.user );
	} ).value( );
}

Template.connected.isOpen = function ( ) {
	return Session.get( 'connectedOpen' );
}

Template.connected.rendered = function ( ) {
	var btn = $( this.find( '.connected-btn' ) ),
		list = $( this.find( 'ul' ) ),
		headerHeight = $( '.header' ).height( );
	if ( Session.get( 'numColumns' ) === 1 ) {
		$( list ).css( {
			position: 'absolute',
			bottom: headerHeight
		} );
		list.find( 'li' ).css( 'min-width', btn.width( ) + 1 );

	}
};

Template.connected.events( {
	'click .connected-btn': function ( evt ) {
		evt.preventDefault( );
		evt.stopPropagation( );
		Session.set( 'connectedOpen', !Session.get( 'connectedOpen' ) );
	}
} );

Template.header.isMobile = function ( ) {
	var columns = Session.get( 'numColumns' );
	if ( columns === 1 ) {
		return true;
	}
	return false;
}

Template.header.brand = function ( ) {
	var numColumns = Session.get( 'numColumns' );
	if ( numColumns > 1 ) {
		return 'Danny Davidson';
	}
	return 'D';
};

Template.header.events( {

	'click h1': function ( evt ) {
		evt.preventDefault( );

		var state = Meteor.db.session.findOne( {
			key: Session.get( 'session' )
		} );
		Meteor.pitch.showStateChange( state._id, state );
	}
} );

Template.nav.sections = function ( ) {
	var sections,
		session = Meteor.db.session.findOne( {
			key: Session.get( 'session' )
		} );

	function toSetActive( config ) {
		if ( config.key === session.active.collection ) {
			config = _( config ).clone( )
			config.active = true;
			config.id = session.active.id;
		}
		return config;
	}

	function activeFirst( config ) {
		return config.active ? 0 : 1;
	}

	if ( session ) {
		sections = _.chain( Meteor.pitch.sectionHeadings )
			.map( toSetActive )
			.sortBy( activeFirst )
			.value( );
		return sections;
	}

	return [ {
		key: 'loading',
		title: 'Loading'
	} ];

}

Template.nav.isOpen = function ( ) {
	return Session.get( 'navOpen' );
}

Template.nav.rendered = function ( ) {
	var btn = $( this.find( 'h2' ) ),
		menu = $( this.find( 'ul' ) ),
		headerHeight = $( '.header' ).height( );
	if ( menu ) {
		if ( Session.get( 'numColumns' ) === 1 ) {
			menu.css( {
				'position': 'absolute',
				'bottom': headerHeight,
			} );
			menu.find( 'li' ).css( 'min-width', btn.width( ) + 1 );
		}
	}
}

Template.nav.events( {

	'click h2': function ( evt ) {
		evt.preventDefault( );
		evt.stopImmediatePropagation( );
		Session.set( 'navOpen', !Session.get( 'navOpen' ) );
	},
	'click li': function ( evt ) {
		var key = $( evt.currentTarget ).data( 'key' ),
			first = _( Meteor.db[ key ].find( {} ).fetch( ) ).first( );

		evt.preventDefault( );
		evt.stopImmediatePropagation( );

		Session.set( 'navOpen', !Session.get( 'navOpen' ) );
		Meteor.db.session.update( Session.get( 'sessionId' ), {
			$set: {
				active: {
					collection: key,
					id: first._id
				}
			}
		} );

	}
} );

Template.education.events( {
	'click .school, tap .school': function ( evt ) {
		evt.preventDefault( );
		Meteor.pitch.setActive( evt, 'education' );
	}
} );

Template.objective.objective = function ( ) {
	var objective = Meteor.db.objective.findOne( {
		session: Session.get( 'session' )
	} );
	return objective;
}

Template.objective.rendered = function ( ) {
	$( window ).unbind( 'keyup' );
	Meteor.pitch.setContentHeight( );
	Meteor.pitch.refreshState( );
};

Template.objective.events( {
	'click h2': function ( evt ) {
		evt.preventDefault( );
		Meteor.pitch.setActive( evt, 'objective' );
	},
	'blur h2': function ( evt ) {
		Meteor.pitch.updateObjective( evt );
	},
	'focus h2': function ( evt ) {
		$( window ).keyup( function ( keyEvt ) {
			if ( _( [ 27, 13 ] ).contains( keyEvt.which ) ) {
				evt.currentTarget = $( '.objective h2' )[ 0 ];
				Meteor.pitch.updateObjective( evt );
			}
		} );
	}
} );

// set events
Template.header.events( {
	'click': toggleModalsOff
} );

Template.main.events( {
	'click': toggleModalsOff
} );
