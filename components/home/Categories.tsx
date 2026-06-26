const kategori = [

"📱 Premium",

"🚀 SMM",

"📞 Pulsa",

"🌐 Kuota",

"🎮 Game",

"💰 E-Wallet",

"⚡ PLN",

"🎁 Voucher"

];

export default function Categories(){

return(

<section className="max-w-7xl mx-auto mt-10">

<h2 className="text-3xl font-bold mb-6">

Kategori

</h2>

<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-5">

{

kategori.map((item)=>(
<div

key={item}

className="rounded-2xl bg-white shadow hover:shadow-xl transition p-6 text-center cursor-pointer"

>

<div className="text-4xl">

{item.split(" ")[0]}

</div>

<p className="mt-3">

{item.replace(item.split(" ")[0],"")}

</p>

</div>

))

}

</div>

</section>

)

}
