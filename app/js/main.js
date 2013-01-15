$("#main").navigator({
    name:"Jordan Kelly",
    avatarUrl:".\\img\\settings.png",
    businessLogoUrl:"img\\myBusiness.jpg",
    roles:[
        {
            name:"FoundOPS",
            id:"23144-24242-242442",
            sections: [
                "Clients",
                "Dispatcher",
                "Employees",
                "Support",
                "Locations",
                "Regions",
                "Services",
                "Vehicles"
            ]
        },
        {name:"Rando", id:"Afsafsaf-24242-242442"},
        {name:"Anotha", id:"Dagag-24242-242442"}
    ],
    sections:[
        {name:"Employees", url:"#Employees", iconUrl:"img\\employees.jpg"},
        {name:"Logout", url:"#Logout", iconUrl:"img\\logout.jpg"},
        {name:"Regions", url:"#Regions", iconUrl:"img\\regions.jpg"},
        {name:"Vehicles", url:"#Vehicles", iconUrl:"img\\vehicles.jpg"}
    ]
});

$(document).navigator("hideSearch");