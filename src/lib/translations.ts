export type Lang = 'en' | 'nl'

const translations: Record<string, Record<Lang, string>> = {
  // Nav & Global
  'nav.signIn': { en: 'Sign In', nl: 'Inloggen' },
  'nav.join': { en: 'Join', nl: 'Word lid' },
  'nav.search': { en: 'Search members, games, clips...', nl: 'Zoek leden, games, clips...' },
  'nav.requestAccess': { en: 'Request access', nl: 'Toegang aanvragen' },

  // Dashboard
  'dashboard.welcome': { en: 'Welcome back', nl: 'Welkom terug' },
  'dashboard.yourLevel': { en: 'YOUR LEVEL', nl: 'JOUW LEVEL' },
  'dashboard.followers': { en: 'FOLLOWERS', nl: 'VOLGERS' },
  'dashboard.posts': { en: 'POSTS', nl: 'BERICHTEN' },
  'dashboard.yourGames': { en: 'YOUR GAMES', nl: 'JOUW GAMES' },
  'dashboard.quickActions': { en: 'QUICK ACTIONS', nl: 'SNELLE ACTIES' },
  'dashboard.createPost': { en: 'Create post', nl: 'Bericht maken' },
  'dashboard.uploadClip': { en: 'Upload clip', nl: 'Clip uploaden' },
  'dashboard.findTeammates': { en: 'Find teammates', nl: 'Vind teamgenoten' },
  'dashboard.xpEarnedBy': { en: 'XP EARNED BY', nl: 'XP VERDIEND DOOR' },
  'dashboard.yourFeed': { en: 'Your feed', nl: 'Jouw feed' },
  'dashboard.global': { en: 'Global', nl: 'Globaal' },
  'dashboard.sharePrompt': { en: 'Share something with the community...', nl: 'Deel iets met de community...' },
  'dashboard.noPosts': { en: 'No posts yet', nl: 'Nog geen berichten' },
  'dashboard.beFirst': { en: 'Be the first to share something', nl: 'Wees de eerste die iets deelt' },

  // Feed
  'feed.title': { en: 'Feed', nl: 'Feed' },
  'feed.subtitle': { en: "What's happening in the community", nl: 'Wat gebeurt er in de community' },
  'feed.recent': { en: 'Recent', nl: 'Recent' },
  'feed.popular': { en: 'Popular', nl: 'Populair' },
  'feed.following': { en: 'Following', nl: 'Volgend' },
  'feed.allGames': { en: 'All Games', nl: 'Alle Games' },
  'feed.whatsOnMind': { en: "What's on your mind?", nl: 'Wat denk je?' },
  'feed.post': { en: 'Post', nl: 'Plaatsen' },
  'feed.cancel': { en: 'Cancel', nl: 'Annuleren' },
  'feed.noGameTag': { en: 'No game tag', nl: 'Geen game tag' },
  'feed.image': { en: 'Image', nl: 'Afbeelding' },
  'feed.video': { en: 'Video', nl: 'Video' },
  'feed.loadMore': { en: 'Load more', nl: 'Meer laden' },
  'feed.noPostsFollowing': { en: 'No posts from people you follow yet', nl: 'Nog geen berichten van mensen die je volgt' },
  'feed.noPostsGlobal': { en: 'No posts yet — be the first!', nl: 'Nog geen berichten — wees de eerste!' },
  'feed.noPostsChannel': { en: 'No posts in this channel yet', nl: 'Nog geen berichten in dit kanaal' },

  // Clips
  'clips.title': { en: 'Clips', nl: 'Clips' },
  'clips.subtitle': { en: 'Share your best moments', nl: 'Deel je beste momenten' },
  'clips.upload': { en: 'Upload Clip', nl: 'Clip uploaden' },
  'clips.cotw': { en: 'CLIP OF THE WEEK', nl: 'CLIP VAN DE WEEK' },
  'clips.noClips': { en: 'No clips yet', nl: 'Nog geen clips' },
  'clips.beFirst': { en: 'Be the first to upload a clip', nl: 'Wees de eerste die een clip uploadt' },
  'clips.videoUrl': { en: 'VIDEO URL', nl: 'VIDEO URL' },
  'clips.game': { en: 'GAME (OPTIONAL)', nl: 'GAME (OPTIONEEL)' },

  // Profile
  'profile.editProfile': { en: 'Edit Profile', nl: 'Profiel bewerken' },
  'profile.save': { en: 'Save', nl: 'Opslaan' },
  'profile.cancel': { en: 'Cancel', nl: 'Annuleren' },
  'profile.follow': { en: 'Follow', nl: 'Volgen' },
  'profile.following': { en: 'Following', nl: 'Volgend' },
  'profile.addBuddy': { en: 'Add Buddy', nl: 'Buddy toevoegen' },
  'profile.requestSent': { en: 'Request Sent', nl: 'Verzoek verstuurd' },
  'profile.acceptBuddy': { en: 'Accept Buddy', nl: 'Buddy accepteren' },
  'profile.buddies': { en: 'Buddies', nl: 'Buddies' },
  'profile.joined': { en: 'Joined', nl: 'Lid sinds' },
  'profile.posts': { en: 'Posts', nl: 'Berichten' },
  'profile.clips': { en: 'Clips', nl: 'Clips' },
  'profile.games': { en: 'Games', nl: 'Games' },
  'profile.gamertags': { en: 'GAMERTAGS', nl: 'GAMERTAGS' },
  'profile.socials': { en: 'SOCIALS', nl: 'SOCIALS' },
  'profile.rank': { en: 'RANK', nl: 'RANG' },
  'profile.bio': { en: 'BIO', nl: 'BIO' },
  'profile.status': { en: 'STATUS', nl: 'STATUS' },
  'profile.availability': { en: 'AVAILABILITY', nl: 'BESCHIKBAARHEID' },
  'profile.displayName': { en: 'DISPLAY NAME', nl: 'WEERGAVENAAM' },
  'profile.notFound': { en: 'User not found', nl: 'Gebruiker niet gevonden' },

  // Rankings
  'rankings.title': { en: 'Rankings', nl: 'Ranglijst' },
  'rankings.competing': { en: 'members competing', nl: 'leden strijden' },
  'rankings.yourRank': { en: 'Your rank', nl: 'Jouw rang' },
  'rankings.topPlayers': { en: 'TOP PLAYERS', nl: 'TOP SPELERS' },
  'rankings.searchPlayers': { en: 'Search players...', nl: 'Zoek spelers...' },
  'rankings.levelDist': { en: 'LEVEL DISTRIBUTION', nl: 'LEVEL VERDELING' },
  'rankings.rankTiers': { en: 'RANK TIERS', nl: 'RANG NIVEAUS' },
  'rankings.howToClimb': { en: 'HOW TO CLIMB', nl: 'HOE STIJG JE' },

  // Tournaments
  'tournaments.title': { en: 'Tournaments', nl: 'Toernooien' },
  'tournaments.subtitle': { en: 'Compete, climb, win', nl: 'Strijd, klim, win' },
  'tournaments.create': { en: 'Create Tournament', nl: 'Toernooi maken' },
  'tournaments.register': { en: 'Register', nl: 'Inschrijven' },
  'tournaments.registered': { en: 'Registered', nl: 'Ingeschreven' },
  'tournaments.noTournaments': { en: 'No tournaments found', nl: 'Geen toernooien gevonden' },
  'tournaments.createOne': { en: 'Create one and start competing', nl: 'Maak er een en start met strijden' },

  // LFG
  'lfg.title': { en: 'LFG', nl: 'LFG' },
  'lfg.subtitle': { en: 'Find teammates, squad up', nl: 'Vind teamgenoten, squad up' },
  'lfg.create': { en: 'Create LFG', nl: 'LFG maken' },
  'lfg.join': { en: 'Join', nl: 'Meedoen' },
  'lfg.applied': { en: 'Applied', nl: 'Aangemeld' },
  'lfg.full': { en: 'Full', nl: 'Vol' },
  'lfg.close': { en: 'Close', nl: 'Sluiten' },
  'lfg.spotsLeft': { en: 'spots left', nl: 'plekken over' },
  'lfg.spotLeft': { en: 'spot left', nl: 'plek over' },
  'lfg.micRequired': { en: 'Mic required', nl: 'Microfoon vereist' },
  'lfg.noPosts': { en: 'No LFG posts right now', nl: 'Geen LFG berichten op dit moment' },
  'lfg.createAndFind': { en: 'Create one and find your squad', nl: 'Maak er een en vind je squad' },

  // Messages
  'messages.title': { en: 'Messages', nl: 'Berichten' },
  'messages.newMessage': { en: 'New Message', nl: 'Nieuw bericht' },
  'messages.searchConv': { en: 'Search conversations...', nl: 'Zoek gesprekken...' },
  'messages.noMessages': { en: 'No messages yet', nl: 'Nog geen berichten' },
  'messages.startConv': { en: 'Start a conversation', nl: 'Begin een gesprek' },
  'messages.selectConv': { en: 'Select a conversation', nl: 'Selecteer een gesprek' },
  'messages.typeMessage': { en: 'Type a message...', nl: 'Typ een bericht...' },
  'messages.searchUsers': { en: 'Search by username...', nl: 'Zoek op gebruikersnaam...' },

  // Achievements
  'achievements.title': { en: 'Achievements', nl: 'Prestaties' },
  'achievements.subtitle': { en: 'Unlock badges, earn XP, show off your grind', nl: 'Ontgrendel badges, verdien XP, laat je progressie zien' },
  'achievements.unlocked': { en: 'UNLOCKED', nl: 'ONTGRENDELD' },
  'achievements.locked': { en: 'LOCKED', nl: 'VERGRENDELD' },
  'achievements.remaining': { en: 'REMAINING', nl: 'RESTEREND' },
  'achievements.xpEarned': { en: 'XP EARNED', nl: 'XP VERDIEND' },

  // Buddy & Coach
  'buddyCoach.title': { en: 'Buddy & Coach', nl: 'Buddy & Coach' },
  'buddyCoach.subtitle': { en: 'Find a gaming buddy or level up with a coach', nl: 'Vind een gaming buddy of level up met een coach' },
  'buddyCoach.findBuddy': { en: 'Find Buddy', nl: 'Vind Buddy' },
  'buddyCoach.coaches': { en: 'Coaches', nl: 'Coaches' },
  'buddyCoach.mySessions': { en: 'My Sessions', nl: 'Mijn Sessies' },
  'buddyCoach.lookingForBuddy': { en: 'Looking for a buddy?', nl: 'Op zoek naar een buddy?' },
  'buddyCoach.toggleOn': { en: 'Toggle this on so others can find you', nl: 'Zet dit aan zodat anderen je kunnen vinden' },
  'buddyCoach.bookSession': { en: 'Book Session', nl: 'Sessie boeken' },
  'buddyCoach.perSession': { en: 'per session', nl: 'per sessie' },

  // Notifications
  'notifications.title': { en: 'Notifications', nl: 'Meldingen' },
  'notifications.markAllRead': { en: 'Mark all read', nl: 'Alles gelezen' },
  'notifications.allCaughtUp': { en: 'All caught up!', nl: 'Alles bijgewerkt!' },
  'notifications.noNotifications': { en: 'No notifications yet', nl: 'Nog geen meldingen' },
  'notifications.unread': { en: 'Unread', nl: 'Ongelezen' },
  'notifications.social': { en: 'Social', nl: 'Sociaal' },
  'notifications.competitive': { en: 'Competitive', nl: 'Competitief' },
  'notifications.system': { en: 'System', nl: 'Systeem' },

  // Admin
  'admin.title': { en: 'Admin Dashboard', nl: 'Admin Dashboard' },
  'admin.users': { en: 'Users', nl: 'Gebruikers' },
  'admin.content': { en: 'Content', nl: 'Inhoud' },
  'admin.reports': { en: 'Reports', nl: 'Meldingen' },
  'admin.games': { en: 'Games', nl: 'Games' },
  'admin.tournaments': { en: 'Tournaments', nl: 'Toernooien' },
  'admin.overview': { en: 'Overview', nl: 'Overzicht' },
  'admin.totalMembers': { en: 'Total Members', nl: 'Totaal leden' },
  'admin.pendingReports': { en: 'pending reports', nl: 'openstaande meldingen' },

  // Onboarding
  'onboarding.setup': { en: 'SETUP YOUR SIGNAL', nl: 'STEL JE SIGNAAL IN' },
  'onboarding.username': { en: 'USERNAME', nl: 'GEBRUIKERSNAAM' },
  'onboarding.displayName': { en: 'DISPLAY NAME', nl: 'WEERGAVENAAM' },
  'onboarding.platforms': { en: 'PLATFORMS', nl: 'PLATFORMS' },
  'onboarding.chooseAvatar': { en: 'CHOOSE YOUR AVATAR', nl: 'KIES JE AVATAR' },
  'onboarding.selectGames': { en: 'SELECT YOUR GAMES', nl: 'SELECTEER JE GAMES' },
  'onboarding.continue': { en: 'Continue', nl: 'Doorgaan' },
  'onboarding.back': { en: 'Back', nl: 'Terug' },
  'onboarding.complete': { en: 'Complete setup', nl: 'Setup afronden' },
  'onboarding.youreIn': { en: "You're in", nl: 'Je bent binnen' },
  'onboarding.welcome': { en: 'Welcome to the void', nl: 'Welkom in de void' },

  // Auth
  'auth.enterTheVoid': { en: 'Enter the void', nl: 'Betreed de void' },
  'auth.email': { en: 'Email', nl: 'E-mail' },
  'auth.password': { en: 'Password', nl: 'Wachtwoord' },
  'auth.noAccount': { en: 'No account?', nl: 'Geen account?' },
  'auth.alreadyInside': { en: 'Already inside?', nl: 'Al binnen?' },
  'auth.signIn': { en: 'Sign in', nl: 'Inloggen' },
  'auth.discord': { en: 'Continue with Discord', nl: 'Doorgaan met Discord' },

  // Common
  'common.all': { en: 'All', nl: 'Alles' },
  'common.save': { en: 'Save', nl: 'Opslaan' },
  'common.cancel': { en: 'Cancel', nl: 'Annuleren' },
  'common.delete': { en: 'Delete', nl: 'Verwijderen' },
  'common.close': { en: 'Close', nl: 'Sluiten' },
  'common.likes': { en: 'likes', nl: 'likes' },
  'common.comments': { en: 'comments', nl: 'reacties' },
  'common.share': { en: 'Share', nl: 'Delen' },
  'common.loading': { en: 'Loading...', nl: 'Laden...' },
  'common.noResults': { en: 'No results found', nl: 'Geen resultaten gevonden' },
  'common.viewAll': { en: 'View all', nl: 'Alles bekijken' },

  // Streaks
  'streak.label': { en: 'STREAK', nl: 'STREAK' },
  'streak.day': { en: 'DAY', nl: 'DAG' },
  'streak.days': { en: 'DAYS', nl: 'DAGEN' },
  'streak.startNow': { en: 'Log in daily to start a streak.', nl: 'Log dagelijks in om een streak te starten.' },
  'streak.aboutToBreak': { en: 'to keep your streak alive', nl: 'om je streak in leven te houden' },
  'streak.best': { en: 'Best', nl: 'Beste' },

  // Widgets
  'widget.recentActivity': { en: 'RECENT ACTIVITY', nl: 'RECENTE ACTIVITEIT' },
  'widget.spotlight': { en: 'SPOTLIGHT · THIS WEEK', nl: 'SPOTLIGHT · DEZE WEEK' },
  'widget.whoToFollow': { en: 'WHO TO FOLLOW', nl: 'WIE TE VOLGEN' },
  'widget.nextTournament': { en: 'NEXT TOURNAMENT', nl: 'VOLGEND TOERNOOI' },
  'widget.liveNow': { en: 'Live now', nl: 'Nu live' },
  'widget.seeAll': { en: 'See all →', nl: 'Alles bekijken →' },
  'widget.nothingYet': { en: 'Nothing yet — check back when others interact with you.', nl: 'Nog niets — kom terug zodra anderen interactie met je hebben.' },

  // Market
  'market.title': { en: 'THE VOID MARKET', nl: 'THE VOID MARKET' },
  'market.subtitle': { en: 'Only for those who know.', nl: 'Alleen voor wie het weet.' },
  'market.secureMembers': { en: 'SECURE · MEMBERS-ONLY · ESCROWED', nl: 'BEVEILIGD · ALLEEN LEDEN · ESCROW' },
  'market.browseVault': { en: 'Browse the vault', nl: 'Doorzoek de kluis' },
  'market.recentDrops': { en: 'Newest listings', nl: 'Nieuwste aanbod' },
  'market.voidVerified': { en: 'Curated by VOIDSIGNL', nl: 'Gecureerd door VOIDSIGNL' },
  'market.sellOnVoid': { en: 'SELL ON VOID', nl: 'VERKOOP OP VOID' },
  'market.applyForSeller': { en: 'Want to sell on VOID? Apply for seller access', nl: 'Wil je verkopen? Vraag verkoper-toegang aan' },
  'market.saved': { en: 'Saved', nl: 'Opgeslagen' },
  'market.wishlist': { en: 'Wishlist', nl: 'Wenslijst' },
  'market.report': { en: 'Report', nl: 'Rapporteren' },
  'market.boost': { en: 'Boost listing', nl: 'Boost listing' },
  'market.featured': { en: 'FEATURED', nl: 'UITGELICHT' },
  'market.bundles': { en: 'BUNDLES', nl: 'BUNDELS' },
  'market.newBundle': { en: 'New bundle', nl: 'Nieuwe bundel' },
  'market.itemsOff': { en: '% OFF', nl: '% KORTING' },

  // Push
  'push.enable': { en: 'Enable push', nl: 'Push aanzetten' },
  'push.on': { en: 'ON', nl: 'AAN' },
  'push.blocked': { en: 'Blocked', nl: 'Geblokkeerd' },

  // PWA
  'pwa.install': { en: 'Install VOIDSIGNL', nl: 'Installeer VOIDSIGNL' },
  'pwa.installDesc': { en: 'Get quicker access + push notifications when you\'re away.', nl: 'Snellere toegang + push-meldingen als je weg bent.' },
  'pwa.later': { en: 'Later', nl: 'Later' },
  'pwa.installBtn': { en: 'Install', nl: 'Installeren' },

  // Bracket
  'bracket.title': { en: 'BRACKET', nl: 'BRACKET' },
  'bracket.generate': { en: 'Generate', nl: 'Genereren' },
  'bracket.tbd': { en: 'TBD', nl: 'TBD' },
  'bracket.bye': { en: 'BYE', nl: 'BYE' },
  'bracket.tapToReport': { en: 'TAP TO REPORT', nl: 'TIK OM TE RAPPORTEREN' },
  'bracket.reportMatch': { en: 'Report match', nl: 'Wedstrijd rapporteren' },
  'bracket.winnerAdvances': { en: 'WINNER ADVANCES AUTOMATICALLY', nl: 'WINNAAR GAAT AUTOMATISCH DOOR' },
  'bracket.final': { en: 'Final', nl: 'Finale' },
  'bracket.semifinal': { en: 'Semifinal', nl: 'Halve finale' },
  'bracket.quarterfinal': { en: 'Quarterfinal', nl: 'Kwartfinale' },
}

export function t(key: string, lang: Lang): string {
  return translations[key]?.[lang] || translations[key]?.en || key
}

export default translations
