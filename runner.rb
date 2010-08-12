# ruby runner.rb command

## Mike, Greg, Franziska Hinkelmann 


# Takes input from dvd website and passes it to M2 to compute fixed points
# returns 0 (no errors) or 1 (errors) 


unless ARGV.size == 1
  puts "Usage: ruby runner.rb command<br>"
  puts ARGV.size 
  exit 0
end


command = ARGV[0]

# mkfifo my_pipe
# echo "command" > my_pipe
#  tail -f my_pipe | M2 > results.txt
# print results.txt inside console

# The fife and tail into M2 must already be running, the pipe must have correct permissions
#`mkfifo tmp/my_pipe`
 `echo "#{command}" > tmp/my_pipe`
#`tail -f tmp/my_pipe | M2 > results.txt &`
#` rm tmp/my_pipe`

puts "<br>"
puts `cat results.txt`

#puts "This is the command we'll run<br>"
#puts  "M2 --stop --no-debug --silent -q -e '#{command}; exit 0'<br>"
#result = `M2 --stop --no-debug --silent -q -e '#{command}; exit 0'`


#puts "<pre> #{result} </pre><br>"
puts "<br>"


exit 0

