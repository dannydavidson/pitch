db = {};
db.session = new Meteor.Collection( 'session' );
db.gigs = new Meteor.Collection( 'gigs' );
db.gigState = new Meteor.Collection( 'gigstate' );

pitch = {
	setContentHeight: function ( ) {
		var height = $( window ).height( );
		$( ".content" ).height( height - ( contentMargin * 3 ) );
	}
}

if ( Meteor.isClient ) {

	Handlebars.registerHelper( 'isActive', function ( data, options ) {
		if ( this.active === data ) {
			return options.fn( this );
		}
		return options.inverse( this );
	} )

	// set content margin, matches content margin in CSS
	var contentMargin = 10,
		setHeights = true;

	var pitch = {
		setContentHeight: function ( ) {
			if ( setHeights ) {
				var height = verge.viewportH( );
				$( ".content" ).height( height - ( contentMargin * 2 ) );
			}
		}
	};

	// Adjust columns according to breakpoints
	enquire.register( "screen and (max-width: 767px)", {
		match: function ( ) {
			Session.set( 'numColumns', 1 );
			setHeights = false;
		}
	} )

	.register( "screen and (min-width: 768px) and (max-width: 1024px)", {
		match: function ( ) {
			Session.set( 'numColumns', 2 );
			setHeights = true;
		}
	} )

	.register( "screen and (min-width: 1024px)", {
		match: function ( ) {
			Session.set( 'numColumns', 3 );
			setHeights = true;
		}
	} );

	// Adjust content height on resize
	$( window ).resize( pitch.setContentHeight );

	// feed the gigs
	Template.gigs.rows = function ( ) {

		// fetch all the gigs, making sure an active state is set
		var gigs = _( db.gigs.find( {} ).fetch( ) ).map( function ( gig ) {
			return _( gig ).defaults( {
				active: 'description'
			} )
		} );

		// group gigs into rows
		return _( gigs ).chain( ).groupBy( function ( gig, i ) {
			return Math.floor( i / Session.get( 'numColumns' ) );
		} ).values( ).value( );

	};

	Template.gig.active = function ( ) {
		// TODO set active state from gigstate record
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

	}

	Template.gig.events( {
		'click .tech, tap .tech': function ( evt ) {
			db.gigs.update( this._id, {
				$set: {
					active: 'tech'
				}
			} );
		},
		'click .lessons, tap .lessons': function ( evt ) {
			db.gigs.update( this._id, {
				$set: {
					active: 'lessons'
				}
			} );
		},
		'click .description, tap .description': function ( evt ) {
			db.gigs.update( this._id, {
				$set: {
					active: 'description'
				}
			} );
		}
	} )

}



if ( Meteor.isServer ) {

	Meteor.startup( function ( ) {

		// reset gigs
		db.gigs.remove( {} );
		_( gigs ).each( function ( gig ) {
			db.gigs.insert( gig );
		} );

		// reset session
		db.session.remove( {} );
		db.session.insert( {
			name: 'default'
		} );

	} );
}
