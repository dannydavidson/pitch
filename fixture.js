var meteor = {
	name: 'Meteor',
	description: 'Reactive, realtime polymorphic javascript framework.',
	url: 'http://meteor.com'
};

gigs = [
	{
		title: 'Serve as Lead Engineer on Front-end Team',
		start_date: '6/13',
		end_date: 'Now',
		company: 'Sports195',
		url: 'http://www.sports195.com',
		location: 'NYC, Austin',
		description: "We've used <a href='https://github.com/airbnb/rendr'>Rendr</a>, a Backbone + Express polymorphic javascript framework from Airbnb, to create a mobile-first, SEO-friendly web app as part of Sport195's growing sports platform.",
		stacks: [
			{
				name: 'Rendr',
				description: 'Backbone + Express'
			},
			{
				name: 'Neo4j',
				description: 'First-in-class graph database'
			}
		],
		learnings: 'Both the hurdles and the awesome potential of polymorphic javascript frameworks for simplifying web development.'
	},
	{
		title: 'Built Google maps Meteor prototype for startup',
		start_date: '2/13',
		end_date: '4/13',
		company: 'Realmassive',
		location: 'Austin, TX',
		description: "Realmassive had a great business model but no vision for their web presence. In less than 60 hours of dev time I built a full-functioning prototype that got them funded by Austin Ventures.",
		stacks: [
			meteor,
			{
				name: 'Google Maps API',
				description: 'Google\'s latest Maps API',
				url: 'https://developers.google.com/maps/documentation/javascript/'
			}
		],
		learnings: 'How to use Meteor to build immersive experiences in record time'
	},
	{
		title: 'Built Rapid Web Prototyping Tools',
		start_date: '5/11',
		end_date: '2/13',
		company: 'Dell',
		url: 'http://www.dell.com',
		location: 'Austin, TX',
		description: "Using a toolkit of Rackspace Cloud, MeteorJS, Git and ZeroMQ I created a rapid prototyping server and workflow allowing easy deployment of Meteor apps based on Git branch.",
		stacks: [
			meteor,
			{
				name: 'Rackspace Cloud',
				url: 'http://www.rackspace.com/cloud/'
			},
			{
				name: 'ZeroMQ',
				description: 'Next-gen messaging framework'
			}
		],
		learnings: 'How to connect distributed systems to create a fun-to-use prototyping platform'
	},
	{
		title: 'Served as Lead Prototyper',
		start_date: '5/11',
		end_date: '2/13',
		company: 'Dell',
		url: 'http://www.dell.com',
		location: 'Austin, TX',
		description: "I helped educate a creative team on modern coding practices and led them through 3 separate prototype builds. Together we made excellent progress molding Twitter's Bootstrap and MeteorJS into a platform for rapid GUI prototyping.",
		stacks: [
			meteor,
			{
				name: 'Twitter Bootstrap',
				description: 'Front-end toolkit',
				url: 'http://getbootstrap.com/2.3.2/'
			}
		],
		learnings: 'How to iterate rapidly with a creative team to build ultra-high fidelity prototypes'
	},
	{
		title: 'Served as Senior Lead Developer on Verizon',
		start_date: '6/10',
		end_date: '5/11',
		company: 'mcgarrybowen',
		url: 'http://www.mcgarrybowen.com/en',
		location: 'NYC',
		description: "My main highlight was a scavenger-hunt sweepstakes site we built for the launch of a Star Wars phone. I managed the project and wrote a Django REST service &amp; custom CMS.",
		stacks: [
			{
				name: 'Django',
			},
			{
				name: 'Twitter API',
			},
			{
				name: 'Flash Platform'
			}
		],
		learnings: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Numquam, maxime, quia, aut fugit possimus eius deleniti dolor illum ex ut ab recusandae excepturi maiores quos repudiandae nostrum cumque harum ratione.'
	},
	{
		title: 'Built a Translation Management System',
		start_date: '6/09',
		end_date: '12/09',
		company: 'T3 for UPS',
		url: 'http://www.t-3.com',
		location: 'Austin, TX',
		description: "Over 5 months with the help of a Django contractor, I designed & amp; built a translation management application for UPS website banners that gave translators a workflow queue with manager approval steps.Translators could live - edit new banners & amp; immediately QA the content in the Flash module.Our internal client could plan out separate messaging deployments & amp; generate deployment tarballs to be loaded directly into their CMS.",
		stacks: [
			{
				name: 'Django',
				description: ''
			},
			{
				name: 'Twitter API',
				description: ''
			},
		],
		learnings: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit. Numquam, maxime, quia, aut fugit possimus eius deleniti dolor illum ex ut ab recusandae excepturi maiores quos repudiandae nostrum cumque harum ratione.'
	}
];

education = [
	{
		title: 'University of Texas at Austin',
		year: '2008',
		default: true,
		degrees: [
			{
				name: 'Bachelor of Business Administration',
				area: 'Marketing'
			},
			{
				name: 'Bachelor of Science',
				area: 'Radio-Television-Film'
			}
		]
	}
];

objective = {
	key: 'default',
	description: "To build a creative workflow around the newest crop of web technologies."
}
