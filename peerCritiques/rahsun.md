**Peer Critiques**\
by: Rahsun Komatsuzaki-Fields\
for: Team SEAL

**What are some aspects of the project that you like, and why?**

I really like how in-depth the ethical analysis is in your project framing.
- You consider impacts to many stakeholders and how widespread, long-term use of ByeBuy can have effect on online commerce within multiple different communities.
- You also consider how your solution may limit certain values (economic freedom and not trusting the user enough) and come up with workarounds for some of them to mitigate the concerns.

I also really like how your proposed SwipeSense and WalletWhisperer features generate recommendations and pointers for shoppers that are based on data from users and their actions. I think that this cycle of tracking a user's actions on ByeBuy and using that data to create new helpful data for more users in the future is quite clever. I also think using the LLM to generate insight into a user's habits is a good way to give useful feedback to users without having to implement observing many manual trends in the data.


**What are some aspects of the project that you wish were different in some way?**

I think that the current design causes too much friction for users who want to control their spending habits.
- Since this app runs on its own website, users would have to manually paste all of their wanted Amazon items into the app to be able to log them.
- I think that over time, a user would be influenced to save the same responses for each question in order to save time, which would probably defeat the purpose of getting users to think critically about why they are spending money needlessly on items.

As of now, users are expected to manually track and log all of their purchased items on Amazon through this app, review other people's items daily, and write reasons for all items they purchase themselves. Giving users this many responsibilities may deter people who want to control their impulse shopping from using this app (especially when this group of people is more likely to succumb to short-term desires).

Additionally, in the current functional design, there is no incentive for users to complete their daily swipes truthfully. They could just quickly categorize every given item as a single option so that they can meet their daily quota faster. You mentioned a possible workaround in the problem framing for this issue, which is to force users to take at least 15 seconds before a vote is counted, though I think a delay like that would be very frustrating for users.

**What are some aspects you are wondering about; perhaps some suggestions for a simplification, a different approach, or whatever?**

I was wondering if there were any plans to incorporate this with other e-commerce sites, such as eBay. The design of the current concept specification could be easily modified to accommodate the API of another e-commerce site, though I acknowledge that implementing this more flexible ItemCollection concept could be challenging.

As for the aforementioned issue for getting users to complete their daily swipes, one idea I had to address this is when having users categorize the given items one-by-one, you first reveal the item, and then 4-5 seconds later, you render the option for them to categorize it as a need or a want. This helps prevent users from just skipping over evaluating each item, while also not making the delay between each rating too annoying.

Finally, I think there is room to give the user more control over their items and swipes. For example, I think that users should be able to choose which items should be open to others for review (i.e. giving users an ability to flag certain items for privacy). I also think they could benefit from having the ability to delete their items and reviews they created at any time.
